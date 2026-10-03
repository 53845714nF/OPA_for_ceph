export const CATEGORY_DETAILS = {
  "Roh- und Primärdaten": { 
    icon: "description", 
    desc: "Original scans, uncompressed audio, raw textual data.", 
    defaultRetentionDays: 3650,
    bucket: "raw-primary",
    isReplicated: true
  },
  "Kuratierte Masterdaten": { 
    icon: "stars", 
    desc: "Cleaned, standardized, and processed data ready for use.", 
    defaultRetentionDays: 36500,
    bucket: "curated-master",
    isReplicated: true
  },
  "Metadaten und Manifeste": { 
    icon: "label", 
    desc: "Descriptive, structural, and administrative XML/JSON.", 
    defaultRetentionDays: 30,
    bucket: "metadata-manifests",
    isReplicated: false
  },
  "Abgeleitete Nutzungsdaten": { 
    icon: "analytics", 
    desc: "Web-ready derivatives, compressed formats, access copies.", 
    defaultRetentionDays: 0,
    bucket: "derived-access",
    isReplicated: false
  },
  "Sensible oder eingeschränkte Daten": { 
    icon: "visibility_off", 
    desc: "Restricted access, PII, culturally sensitive materials.", 
    isSensitive: true, 
    defaultRetentionDays: 1825,
    bucket: "sensitive-restricted",
    isReplicated: false
  },
  "Betriebs- und Auditdaten": { 
    icon: "manage_history", 
    desc: "System logs, checksums, process documentation.", 
    defaultRetentionDays: 2555,
    bucket: "operational-audit",
    isReplicated: false
  }
} as const;

export const CATEGORIES = Object.keys(CATEGORY_DETAILS) as Array<keyof typeof CATEGORY_DETAILS>;

