from os import getenv

# Configuration
OPA_URL = getenv("OPA_URL", "http://localhost:8181")
CEPH_API_URL = getenv("CEPH_API_URL", "https://192.168.178.166:8443/api")
CEPH_USERNAME = getenv("CEPH_USERNAME", "admin")
CEPH_PASSWORD = getenv("CEPH_PASSWORD", "password")

# Database Configuration (PostgreSQL)
DATABASE_URL = getenv("DATABASE_URL")
POSTGRES_HOST = getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = getenv("POSTGRES_DB", "decision_service")
POSTGRES_USER = getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = getenv("POSTGRES_PASSWORD", "postgres")

# S3 Configuration
S3_ACCESS_KEY = getenv("S3_ACCESS_KEY", "test")
S3_SECRET_KEY = getenv("S3_SECRET_KEY", "test")
S3_REGION = getenv("S3_REGION", "default")

S3_ZONES_CONFIG = {
    "zone-a": getenv("S3_ENDPOINT_ZONE_A", "http://192.168.178.166:80"),
    "zone-b": getenv("S3_ENDPOINT_ZONE_B", "http://192.168.178.170:80"),
}

# Human-readable labels for the UI/Dashboard
ZONE_LABELS = {
    "zone-a": getenv("ZONE_A_LABEL", "Kairo"),
    "zone-b": getenv("ZONE_B_LABEL", "Erbil"),
}

# Geolocation coordinates and points for map visualization
ZONE_LOCATION = {
    "zone-a": {
        "city": getenv("ZONE_A_CITY", "Kairo"),
        "label": ZONE_LABELS.get("zone-a", "Standort A"),
        "lat": float(getenv("ZONE_A_LAT", "29.955632")),
        "lon": float(getenv("ZONE_A_LON", "31.272325")),
    },
    "zone-b": {
        "city": getenv("ZONE_B_CITY", "Erbil"),
        "label": ZONE_LABELS.get("zone-b", "Standort B"),
        "lat": float(getenv("ZONE_B_LAT", "36.1888156792475")),
        "lon": float(getenv("ZONE_B_LON", "43.96363390226423")),
    },
}
ZONE_LOCATIONS = ZONE_LOCATION  # Alias for plural usage

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
