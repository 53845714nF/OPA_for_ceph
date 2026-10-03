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
        "implications": ["local_redundancy", "versioning", "tamper_protection", "independent_preservation"]
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

# Liste der Rollen, die zum Löschen berechtigt sind (Ausschließlich Admin)
authorized_delete_roles := ["admin"]

# Liste der Rollen, die zum Bearbeiten und Umbenennen berechtigt sind (Admin und Kurator)
authorized_modify_roles := ["admin", "curator"]

# Hilfsregeln zur Identifikation der Aktionen
is_delete_action if {
    input.action == "delete"
}

is_modify_action if {
    input.action in ["modify", "edit", "rename", "promote"]
}

is_promote_action if {
    input.action == "promote"
}

is_promote_action if {
    is_modify_action
    input.target_bucket in ["curated-master", "curated_master"]
}

is_promote_action if {
    is_modify_action
    input.promote_to_master == true
}

# Compliance-Regel
default allow := false

# Erlauben für Upload (Standardfall, wenn weder Löschen noch Bearbeiten):
# 1. Keine Policy-Verstöße vorliegen
# 2. Der User eine berechtigte Upload-Rolle hat
allow if {
    not is_delete_action
    not is_modify_action
    count(violations) == 0
    input.role in authorized_upload_roles
}

# Erlauben für Löschen:
# 1. Keine Policy-Verstöße vorliegen
# 2. Der User eine berechtigte Lösch-Rolle hat (ausschließlich Admin)
allow if {
    is_delete_action
    count(violations) == 0
    input.role in authorized_delete_roles
}

# Erlauben für Bearbeiten / Umbenennen / Erheben:
# 1. Keine Policy-Verstöße vorliegen
# 2. Der User ist Admin oder Kurator
allow if {
    is_modify_action
    count(violations) == 0
    input.role in authorized_modify_roles
}

# Spezifische Abfrage für Löschberechtigung
default allow_delete := false
allow_delete if {
    input.role in authorized_delete_roles
}

# Spezifische Abfrage für Bearbeitungs- und Umbenennungsberechtigung
default allow_modify := false
allow_modify if {
    count(violations) == 0
    input.role in authorized_modify_roles
}

# Spezifische Abfrage für Erhebung von Rohdaten zu kuratierten Masterdaten
default allow_promote := false
allow_promote if {
    is_promote_action
    count(violations) == 0
    input.role in authorized_modify_roles
}

# Detaillierte Validierung der erforderlichen Policies (Upload-Kontext)
violations contains msg if {
    not is_delete_action
    not is_modify_action
    input.category
    some required in data_categories[input.category].implications
    not required in input.applied_policies
    msg := sprintf("Kategorie '%v' erfordert die Policy '%v', aber sie fehlt.", [input.category, required])
}

# Fehlermeldung bei fehlender Upload-Berechtigung
violations contains msg if {
    not is_delete_action
    not is_modify_action
    not input.role in authorized_upload_roles
    msg := sprintf("User mit der Rolle '%v' ist nicht zum Upload berechtigt.", [input.role])
}

# Fehlermeldung bei fehlender Lösch-Berechtigung
violations contains msg if {
    is_delete_action
    not input.role in authorized_delete_roles
    msg := sprintf("User mit der Rolle '%v' ist nicht zum Löschen berechtigt. Nur Administratoren dürfen Daten löschen.", [input.role])
}

# Fehlermeldung bei fehlender Bearbeitungs-/Umbenennungsberechtigung
violations contains msg if {
    is_modify_action
    not input.role in authorized_modify_roles
    msg := sprintf("User mit der Rolle '%v' ist nicht zum Bearbeiten oder Erheben von Daten berechtigt. Nur Administratoren und Kuratoren dürfen Daten bearbeiten und zu curated_master erheben.", [input.role])
}

# Validierung: Erhebung zu kuratierten Masterdaten darf ausschließlich von Rohdaten ausgehen
violations contains msg if {
    is_promote_action
    input.bucket
    not input.bucket in ["raw-primary", "raw_primary"]
    msg := sprintf("Nur Rohdaten ('raw-primary') können zu 'curated_master' erhoben werden. Das Bucket '%v' ist dafür nicht zulässig.", [input.bucket])
}

# --- Routing & Retention Logik (Agnostisch für Ceph Multisite) ---

# Replikations-Policy:
# Erlaubt Replikation, wenn die Kategorie geografische Redundanz oder Replikation erfordert
default allow_replication := false

allow_replication := true if {
    "geographic_redundancy" in data_categories[input.category].implications
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
