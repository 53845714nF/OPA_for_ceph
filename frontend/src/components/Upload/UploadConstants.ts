export const CATEGORY_DETAILS = {
  "Roh- und Primärdaten": { icon: "description", desc: "Original scans, uncompressed audio, raw textual data.", defaultRetentionDays: 3650 },
  "Kuratierte Masterdaten": { icon: "stars", desc: "Cleaned, standardized, and processed data ready for use.", defaultRetentionDays: 36500 },
  "Metadaten und Manifeste": { icon: "label", desc: "Descriptive, structural, and administrative XML/JSON.", defaultRetentionDays: 30 },
  "Abgeleitete Nutzungsdaten": { icon: "analytics", desc: "Web-ready derivatives, compressed formats, access copies.", defaultRetentionDays: 0 },
  "Sensible oder eingeschränkte Daten": { icon: "visibility_off", desc: "Restricted access, PII, culturally sensitive materials.", isSensitive: true, defaultRetentionDays: 1825 },
  "Betriebs- und Auditdaten": { icon: "manage_history", desc: "System logs, checksums, process documentation.", defaultRetentionDays: 2555 }
} as const;

export const CATEGORIES = Object.keys(CATEGORY_DETAILS) as Array<keyof typeof CATEGORY_DETAILS>;
