from config import (
    OPA_URL, 
    CEPH_API_URL, 
    CEPH_USERNAME, 
    CEPH_PASSWORD, 
    S3_ACCESS_KEY, 
    S3_SECRET_KEY, 
    S3_ZONES_CONFIG
)
from .ceph import CephClient
from .opa import OPAClient
from .s3 import S3Client

ceph_client = CephClient(CEPH_API_URL, CEPH_USERNAME, CEPH_PASSWORD)
opa_client = OPAClient(OPA_URL)

# S3 Clients for all configured zones
s3_clients = {
    zone: S3Client(endpoint, S3_ACCESS_KEY, S3_SECRET_KEY)
    for zone, endpoint in S3_ZONES_CONFIG.items()
}
