import boto3
from botocore.exceptions import ClientError
from botocore.config import Config

class S3Client:
    def __init__(self, endpoint_url: str, access_key: str, secret_key: str, region_name: str = "default"):
        config = Config(
            connect_timeout=5,
            read_timeout=5,
            retries={'max_attempts': 1}
        )
        self.client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region_name,
            config=config
        )

    def ensure_bucket_exists(self, bucket_name: str, use_object_lock: bool = False):
        try:
            self.client.head_bucket(Bucket=bucket_name)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] in ['404', '403', 'NoSuchBucket']:
                create_args = {'Bucket': bucket_name}
                if use_object_lock:
                    create_args['ObjectLockEnabledForBucket'] = True
                try:
                    self.client.create_bucket(**create_args)
                except Exception as create_err:
                    # Ceph RGW returns JSON to system users which botocore fails to parse as XML
                    # Verify if bucket was created anyway
                    try:
                        self.client.head_bucket(Bucket=bucket_name)
                    except Exception:
                        print(f"Bucket creation check after exception failed: {create_err}")
                        raise create_err
                
                # Ceph RGW (and AWS S3) explicitly requires versioning for Object Lock
                if use_object_lock:
                    try:
                        self.client.put_bucket_versioning(
                            Bucket=bucket_name,
                            VersioningConfiguration={'Status': 'Enabled'}
                        )
                    except Exception as v_err:
                        print(f"Warning setting bucket versioning: {v_err}")
                return True
            else:
                raise
        except Exception:
            return True

    def upload_file(self, file_obj, bucket_name: str, object_name: str, use_object_lock: bool = False, retention_days: int = 0, metadata: dict = None):
        try:
            self.ensure_bucket_exists(bucket_name, use_object_lock=use_object_lock)

            # Upload the file with optional retention and metadata
            upload_args = {'ExtraArgs': {}}
            if retention_days > 0:
                from datetime import datetime, timedelta, timezone
                until_date = datetime.now(timezone.utc) + timedelta(days=retention_days)
                
                upload_args['ExtraArgs'].update({
                    'ObjectLockMode': 'GOVERNANCE',
                    'ObjectLockRetainUntilDate': until_date
                })
            
            if metadata:
                upload_args['ExtraArgs']['Metadata'] = metadata

            self.client.upload_fileobj(file_obj, bucket_name, object_name, **upload_args)
            return True
        except Exception as e:
            print(f"S3 Upload Error: {e}")
            raise e

    def delete_object(self, bucket_name: str, object_name: str, bypass_governance: bool = True) -> bool:
        """Löscht ein Objekt aus dem S3 Bucket (auch bei aktiviertem Object Lock via Governance Bypass)."""
        try:
            # Versuche zunächst, alle Versionen und Löschmarker zu entfernen (bei Versionierung/Object-Lock)
            try:
                versions_res = self.client.list_object_versions(Bucket=bucket_name, Prefix=object_name)
                versions_to_delete = []
                for v in versions_res.get('Versions', []):
                    if v['Key'] == object_name:
                        versions_to_delete.append({'Key': object_name, 'VersionId': v['VersionId']})
                for dm in versions_res.get('DeleteMarkers', []):
                    if dm['Key'] == object_name:
                        versions_to_delete.append({'Key': object_name, 'VersionId': dm['VersionId']})

                if versions_to_delete:
                    del_kwargs = {
                        'Bucket': bucket_name,
                        'Delete': {'Objects': versions_to_delete}
                    }
                    if bypass_governance:
                        del_kwargs['BypassGovernanceRetention'] = True
                    self.client.delete_objects(**del_kwargs)
                    return True
            except Exception as v_err:
                print(f"S3 list_object_versions fallback: {v_err}")

            # Standard-Löschung
            kwargs = {
                'Bucket': bucket_name,
                'Key': object_name
            }
            if bypass_governance:
                kwargs['BypassGovernanceRetention'] = True
            self.client.delete_object(**kwargs)
            return True
        except Exception as e:
            print(f"S3 Delete Error: {e}")
            raise e

    def get_object_metadata(self, bucket_name: str, key: str) -> dict:
        """Gibt die Metadaten eines Objekts zurück."""
        try:
            head = self.client.head_object(Bucket=bucket_name, Key=key)
            return head.get('Metadata', {})
        except Exception as e:
            print(f"S3 head_object error for {bucket_name}/{key}: {e}")
            return {}

    def copy_object(
        self,
        bucket_name: str,
        src_key: str,
        dest_key: str,
        metadata: dict = None,
        dest_bucket: str = None,
        retention_days: int = 0
    ) -> bool:
        """Kopiert ein Objekt innerhalb eines Buckets oder über Buckets hinweg."""
        target_bucket = dest_bucket or bucket_name
        try:
            copy_source = {'Bucket': bucket_name, 'Key': src_key}
            kwargs = {
                'Bucket': target_bucket,
                'Key': dest_key,
                'CopySource': copy_source,
            }
            if metadata is not None:
                kwargs['Metadata'] = metadata
                kwargs['MetadataDirective'] = 'REPLACE'
            else:
                kwargs['MetadataDirective'] = 'COPY'

            if retention_days > 0:
                from datetime import datetime, timedelta, timezone
                until_date = datetime.now(timezone.utc) + timedelta(days=retention_days)
                kwargs['ObjectLockMode'] = 'GOVERNANCE'
                kwargs['ObjectLockRetainUntilDate'] = until_date

            try:
                self.client.copy_object(**kwargs)
            except Exception as copy_err:
                if 'ObjectLockMode' in kwargs:
                    del kwargs['ObjectLockMode']
                    del kwargs['ObjectLockRetainUntilDate']
                    self.client.copy_object(**kwargs)
                else:
                    raise copy_err
            return True
        except Exception as e:
            print(f"S3 Copy Error ({bucket_name}/{src_key} -> {target_bucket}/{dest_key}): {e}")
            raise e

    def move_object(
        self,
        src_bucket: str,
        src_key: str,
        dest_bucket: str,
        dest_key: str,
        metadata: dict = None,
        retention_days: int = 0
    ) -> bool:
        """Verschiebt ein Objekt in ein anderes Bucket oder benennt es um."""
        if src_bucket == dest_bucket and src_key == dest_key:
            if metadata is not None:
                return self.copy_object(src_bucket, src_key, dest_key, metadata=metadata)
            return True
        # 1. Sicherstellen, dass das Zielbucket existiert
        self.ensure_bucket_exists(dest_bucket, use_object_lock=(retention_days > 0))
        # 2. Kopieren ins Zielbucket
        self.copy_object(
            bucket_name=src_bucket,
            src_key=src_key,
            dest_key=dest_key,
            metadata=metadata,
            dest_bucket=dest_bucket,
            retention_days=retention_days
        )
        # 3. Aus dem Quellbucket löschen
        self.delete_object(src_bucket, src_key, bypass_governance=True)
        return True

    def rename_object(self, bucket_name: str, old_key: str, new_key: str, metadata: dict = None) -> bool:
        """Benennt ein Objekt um (Kopieren nach new_key und Löschen von old_key)."""
        return self.move_object(
            src_bucket=bucket_name,
            src_key=old_key,
            dest_bucket=bucket_name,
            dest_key=new_key,
            metadata=metadata
        )

    def update_object_metadata(self, bucket_name: str, key: str, metadata: dict) -> bool:
        """Aktualisiert die Metadaten eines Objekts in-place."""
        return self.copy_object(bucket_name, key, key, metadata=metadata)

    def get_object_keys(self):
        """Gibt ein Set von (bucket, key) aller Objekte dieser Zone zurück."""
        keys = set()
        try:
            buckets = self.client.list_buckets().get('Buckets', [])
            for bucket in buckets:
                name = bucket['Name']
                paginator = self.client.get_paginator('list_objects_v2')
                for page in paginator.paginate(Bucket=name):
                    for obj in page.get('Contents', []):
                        keys.add((name, obj['Key']))
        except Exception as e:
            print(f"S3 Keys Error: {e}")
        return keys

    def get_object_count(self):
        try:
            buckets = self.client.list_buckets().get('Buckets', [])
            total_objects = 0
            for bucket in buckets:
                name = bucket['Name']
                paginator = self.client.get_paginator('list_objects_v2')
                for page in paginator.paginate(Bucket=name):
                    total_objects += page.get('KeyCount', 0)
            return total_objects
        except Exception as e:
            print(f"S3 Count Error: {e}")
            return 0

    def generate_presigned_url(self, bucket_name: str, object_name: str, expiration: int = 3600, version_id: str | None = None):
        try:
            params = {'Bucket': bucket_name, 'Key': object_name}
            if version_id:
                params['VersionId'] = version_id
            response = self.client.generate_presigned_url('get_object',
                                                         Params=params,
                                                         ExpiresIn=expiration)
            return response
        except Exception as e:
            print(f"S3 Presigned URL Error: {e}")
            return None

    def get_object_content(self, bucket_name: str, key: str, version_id: str | None = None) -> bytes | None:
        """Liest den Inhalt eines Objekts aus S3/Ceph als Bytes (optional spezifische Version)."""
        try:
            params = {'Bucket': bucket_name, 'Key': key}
            if version_id:
                params['VersionId'] = version_id
            resp = self.client.get_object(**params)
            return resp['Body'].read()
        except Exception as e:
            print(f"S3 get_object_content error for {bucket_name}/{key} (version={version_id}): {e}")
            return None

    def get_object_versions(self, bucket_name: str, key: str) -> list[dict]:
        """Liefert alle Versionen eines Objekts chronologisch sortiert."""
        versions = []
        try:
            paginator = self.client.get_paginator('list_object_versions')
            for page in paginator.paginate(Bucket=bucket_name, Prefix=key):
                for v in page.get('Versions', []):
                    if v['Key'] == key:
                        versions.append({
                            "version_id": v['VersionId'],
                            "is_latest": v.get('IsLatest', False),
                            "last_modified": v['LastModified'].isoformat(),
                            "size": v['Size'],
                            "etag": v['ETag'].replace('"', '')
                        })
        except Exception as e:
            print(f"S3 get_object_versions error for {bucket_name}/{key}: {e}")
        return versions

    def search_objects(self, query: str):
        try:
            results = []
            buckets = self.client.list_buckets().get('Buckets', [])
            
            # Fetch object version counts across buckets
            version_counts = {}
            for bucket in buckets:
                name = bucket['Name']
                try:
                    paginator_v = self.client.get_paginator('list_object_versions')
                    for page in paginator_v.paginate(Bucket=name):
                        for v in page.get('Versions', []):
                            k = v['Key']
                            version_counts[(name, k)] = version_counts.get((name, k), 0) + 1
                except Exception:
                    pass

            for bucket in buckets:
                name = bucket['Name']
                paginator = self.client.get_paginator('list_objects_v2')
                for page in paginator.paginate(Bucket=name):
                    for obj in page.get('Contents', []):
                        key = obj['Key']
                        # Simple case-insensitive search in the object key
                        if not query or query.lower() in key.lower():
                            # Fetch metadata to get Accession Identifier
                            metadata = {}
                            try:
                                head = self.client.head_object(Bucket=name, Key=key)
                                metadata = head.get('Metadata', {})
                            except Exception:
                                pass

                            # Determine if it's an image based on extension
                            is_image = key.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
                            is_yaml = key.lower().endswith(('.yml', '.yaml')) or name == 'metadata-manifests'
                            
                            results.append({
                                "key": key,
                                "bucket": name,
                                "size": obj['Size'],
                                "last_modified": obj['LastModified'].isoformat(),
                                "etag": obj['ETag'].replace('"', ''),
                                "accession_id": metadata.get('accession-id', 'N/A'),
                                "is_yaml": is_yaml,
                                "version_count": version_counts.get((name, key), 1),
                                "preview_url": self.generate_presigned_url(name, key) if is_image else None
                            })
            return results
        except Exception as e:
            print(f"S3 Search Error: {e}")
            return []
