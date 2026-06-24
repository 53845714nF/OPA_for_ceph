from os import getenv

# Configuration
OPA_URL = getenv("OPA_URL", "http://localhost:8181")
CEPH_API_URL = getenv("CEPH_API_URL", "http://localhost:8081/api")
CEPH_USERNAME = getenv("CEPH_USERNAME", "admin")
CEPH_PASSWORD = getenv("CEPH_PASSWORD", "ceph-password")

# S3 Configuration
S3_ACCESS_KEY = getenv("S3_ACCESS_KEY", "test")
S3_SECRET_KEY = getenv("S3_SECRET_KEY", "test")

# Define storage zones as a dictionary: {zone_name: endpoint_url}
S3_ZONES_CONFIG = {
    "ägypten": getenv("S3_ENDPOINT_EGYPT", "http://localhost:80"),
    "irak": getenv("S3_ENDPOINT_IRAQ", "http://localhost:8001"),
}

# Mapping of categories from frontend UI values to OPA-specific categories
CATEGORY_MAPPING = {
    # German categories from the frontend UI
    "Roh- und Primärdaten": "raw_primary",
    "Kuratierte Masterdaten": "curated_master",
    "Metadaten und Manifeste": "metadata_manifests",
    "Abgeleitete Nutzungsdaten": "derived_access",
    "Sensible oder eingeschränkte Daten": "sensitive_restricted",
    "Betriebs- und Auditdaten": "operational_audit",
    # English/legacy keys
    "primary": "raw_primary",
    "master": "curated_master",
    "manifest": "metadata_manifests",
    "access": "derived_access",
    "restricted": "sensitive_restricted",
    "audit": "operational_audit",
}

# JWT Configuration
SECRET_KEY = getenv("JWT_SECRET_KEY", "super-secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
