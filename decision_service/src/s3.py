import boto3
from botocore.exceptions import ClientError
import os

class S3Client:
    def __init__(self, endpoint_url: str, access_key: str, secret_key: str):
        self.client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name='world' # Matching the realm/zonegroup in install-microceph.sh
        )

    def upload_file(self, file_obj, bucket_name: str, object_name: str, use_object_lock: bool = False, retention_days: int = 0):
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
                else:
                    raise

            # Upload the file with optional retention
            upload_args = {}
            if retention_days > 0:
                from datetime import datetime, timedelta, timezone
                until_date = datetime.now(timezone.utc) + timedelta(days=retention_days)
                upload_args['ExtraArgs'] = {
                    'ObjectLockMode': 'GOVERNANCE',
                    'ObjectLockRetainUntilDate': until_date
                }

            self.client.upload_fileobj(file_obj, bucket_name, object_name, **upload_args)
            return True
        except Exception as e:
            print(f"S3 Upload Error: {e}")
            raise e
