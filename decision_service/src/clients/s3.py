import boto3
from botocore.exceptions import ClientError
from botocore.config import Config

class S3Client:
    def __init__(self, endpoint_url: str, access_key: str, secret_key: str):
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
            region_name='world',
            config=config
        )

    def upload_file(self, file_obj, bucket_name: str, object_name: str, use_object_lock: bool = False, retention_days: int = 0, metadata: dict = None):
        try:
            # Ensure bucket exists
            try:
                self.client.head_bucket(Bucket=bucket_name)
            except ClientError as e:
                if e.response['Error']['Code'] == '404':
                    create_args = {'Bucket': bucket_name}
                    if use_object_lock:
                        create_args['ObjectLockEnabledForBucket'] = True
                    self.client.create_bucket(**create_args)
                    
                    # Ceph RGW (and AWS S3) explicitly requires versioning for Object Lock
                    if use_object_lock:
                        self.client.put_bucket_versioning(
                            Bucket=bucket_name,
                            VersioningConfiguration={'Status': 'Enabled'}
                        )
                else:
                    raise

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

    def generate_presigned_url(self, bucket_name: str, object_name: str, expiration: int = 3600):
        try:
            response = self.client.generate_presigned_url('get_object',
                                                         Params={'Bucket': bucket_name,
                                                                 'Key': object_name},
                                                         ExpiresIn=expiration)
            return response
        except Exception as e:
            print(f"S3 Presigned URL Error: {e}")
            return None

    def search_objects(self, query: str):
        try:
            results = []
            buckets = self.client.list_buckets().get('Buckets', [])
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
                            
                            results.append({
                                "key": key,
                                "bucket": name,
                                "size": obj['Size'],
                                "last_modified": obj['LastModified'].isoformat(),
                                "etag": obj['ETag'].replace('"', ''),
                                "accession_id": metadata.get('accession-id', 'N/A'),
                                "preview_url": self.generate_presigned_url(name, key) if is_image else None
                            })
            return results
        except Exception as e:
            print(f"S3 Search Error: {e}")
            return []
