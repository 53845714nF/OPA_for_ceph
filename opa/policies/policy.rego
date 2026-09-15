package data_management

import rego.v1

# Definition der Kategorien mit ihren Eigenschaften und Aufbewahrungsfristen (in Tagen)
data_categories := {
    "raw_primary": {
        "priority": "High",
        "retention_days": 3650, # 10 Jahre
        "object_lock": true,
        "implications": ["fixity_checks", "local_redundancy", "version_retention", "replication_before_deletion"]
    },
    "curated_master": {
        "priority": "Very high",
        "retention_days": 36500, # 100 Jahre (Archiv-Standard)
        "object_lock": true,
        "implications": ["highest_durability", "provenance", "geographic_redundancy", "periodic_integrity_checks"]
    },
    "metadata_manifests": {
        "priority": "Critical",
        "retention_days": 30, # 30 Tage für Manifeste
        "object_lock": true,
        "implications": ["immediate_replication", "versioning", "tamper_protection", "independent_preservation"]
    },
    "derived_access": {
        "priority": "Low to medium",
        "retention_days": 0, # Keine feste Aufbewahrung
        "object_lock": false,
        "implications": ["lower_cost_storage"]
    },
    "sensitive_restricted": {
        "priority": "Policy-dependent",
        "retention_days": 1825, # 5 Jahre
        "object_lock": true,
        "implications": ["encryption", "jurisdiction_aware_placement", "strict_access_control", "audit_logging"]
    },
    "operational_audit": {
        "priority": "High",
        "retention_days": 2555, # 7 Jahre
        "object_lock": true,
        "implications": ["retention_policies", "tamper_evident_logging", "replication_trusted_domains"]
    }
}

# --- Autorisierungs-Logik ---

# Liste der Rollen, die zum Upload berechtigt sind
authorized_upload_roles := ["admin", "curator"]

# Compliance-Regel
default allow := false

# Erlauben wenn:
# 1. Keine Policy-Verstöße vorliegen
# 2. Der User eine berechtigte Rolle hat
allow if {
    count(violations) == 0
    input.role in authorized_upload_roles
}

# Detaillierte Validierung der erforderlichen Policies
violations contains msg if {
    some required in data_categories[input.category].implications
    not required in input.applied_policies
    msg := sprintf("Kategorie '%v' erfordert die Policy '%v', aber sie fehlt.", [input.category, required])
}

# Fehlermeldung bei fehlender Berechtigung
violations contains msg if {
    not input.role in authorized_upload_roles
    msg := sprintf("User mit der Rolle '%v' ist nicht zum Upload berechtigt.", [input.role])
}

# --- Routing & Retention Logik (Agnostisch für Ceph Multisite) ---

# Replikations-Policy:
# Erlaubt Replikation, wenn die Kategorie geografische Redundanz oder Replikation erfordert
default allow_replication := false

allow_replication := true if {
    "geographic_redundancy" in data_categories[input.category].implications
}

allow_replication := true if {
    "immediate_replication" in data_categories[input.category].implications
}

allow_replication := true if {
    "replication_before_deletion" in data_categories[input.category].implications
}

# Bestimmung der primären Ingress-Zone (Datensouveränität)
# Standardmäßig zone-a
default primary_zone := "zone-a"

# Sensible Daten oder standortspezifische Autoren
primary_zone := "zone-b" if {
    input.category == "sensitive_restricted"
}

primary_zone := "zone-b" if {
    input.author == "Ali"
}

# Bestimmung aller Zielzonen:
# Bei erlaubter Replikation sind alle konfigurierten Zonen Ziele
# Bei unterdrückter Replikation verbleibt das Datum exklusiv in der primary_zone
default target_zones := ["zone-a"]

target_zones := ["zone-a", "zone-b"] if {
    allow_replication
}

target_zones := [primary_zone] if {
    not allow_replication
}

# Extraktion der Aufbewahrungsregeln für das Backend
retention_days := data_categories[input.category].retention_days
use_object_lock := data_categories[input.category].object_lock

# Abwärtskompatibilität
target_zone := primary_zone
