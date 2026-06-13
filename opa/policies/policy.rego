package data_management

import rego.v1

# Die Tabelle als statisches Daten-Mapping (Knowledge Base)
data_categories := {
    "raw_primary": {
        "priority": "High",
        "implications": ["fixity_checks", "local_redundancy", "version_retention", "replication_before_deletion"]
    },
    "curated_master": {
        "priority": "Very high",
        "implications": ["highest_durability", "provenance", "geographic_redundancy", "periodic_integrity_checks"]
    },
    "metadata_manifests": {
        "priority": "Critical",
        "implications": ["immediate_replication", "versioning", "tamper_protection", "independent_preservation"]
    },
    "derived_access": {
        "priority": "Low to medium",
        "implications": ["lower_cost_storage"]
    },
    "sensitive_restricted": {
        "priority": "Policy-dependent",
        "implications": ["encryption", "jurisdiction_aware_placement", "strict_access_control", "audit_logging"]
    },
    "operational_audit": {
        "priority": "High",
        "implications": ["retention_policies", "tamper_evident_logging", "replication_trusted_domains"]
    }
}

# Basis-Regeln zum Abfragen von Werten
# Gibt die Priorität der im Input übergebenen Kategorie zurück
get_priority := data_categories[input.category].priority

# Gibt die benötigten Richtlinien (Implications) zurück
get_required_policies := data_categories[input.category].implications

# Hilfsfunktion, um auf input.applied_policies sicher zuzugreifen (vermeidet Fehler, wenn nicht gesetzt)
applied_policies := input.applied_policies if {
    "applied_policies" in object.keys(input)
} else := []

# Compliance-Regel (Zulassungsprüfung)
# Standardmäßig wird eine Speicheranfrage abgelehnt
default allow := false

# Eine Anfrage wird nur erlaubt, wenn die vom System angewendeten Policies 
# (input.applied_policies) alle für die Kategorie geforderten Policies abdecken.
allow if {
    # Die Anfrage ist gültig, wenn es keine Verstöße (violations) gibt.
    count(violations) == 0
}

# Detaillierte Validierung und Warnungen (Violations)
# Sammelt alle fehlenden Policies als Fehlermeldungen in einem Set
violations contains msg if {
    some required in data_categories[input.category].implications
    not required in applied_policies
    msg := sprintf("Kategorie '%v' erfordert die Policy '%v', aber sie fehlt.", [input.category, required])
}

# Spezifische Deny-Regeln (Beispiele für feingranulare Checks)

# Schlägt an, wenn "sensitive_restricted" Daten ohne Verschlüsselung verarbeitet werden
deny_unencrypted_sensitive_data if {
    input.category == "sensitive_restricted"
    not "encryption" in applied_policies
}

# Schlägt an, wenn für "curated_master" keine geografische Redundanz vorliegt
deny_missing_geo_redundancy if {
    input.category == "curated_master"
    not "geographic_redundancy" in applied_policies
}

# Schlägt an, wenn für "metadata_manifests" kein Manipulationssicherung existiert
deny_missing_tamper_protection if {
    input.category == "metadata_manifests"
    not "tamper_protection" in applied_policies
}

# --- Routing Logik zwischen Zonen (Ägypten / Irak) ---
default target_zone := "ägypten"

# Wenn die Daten sensibel sind, in die Irak Zone (Irak) routen
target_zone := "irak" if {
    input.category == "sensitive_restricted"
}

# Wenn der Autor spezifisch für Irak ist, ebenfalls in die Irak Zone routen
target_zone := "irak" if {
    input.author == "Ali"
}