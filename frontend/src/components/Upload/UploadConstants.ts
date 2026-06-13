export const CATEGORY_DETAILS = {
  "Roh- und Primärdaten": { icon: "description", desc: "Original scans, uncompressed audio, raw textual data." },
  "Kuratierte Masterdaten": { icon: "stars", desc: "Cleaned, standardized, and processed data ready for use." },
  "Metadaten und Manifeste": { icon: "label", desc: "Descriptive, structural, and administrative XML/JSON." },
  "Abgeleitete Nutzungsdaten": { icon: "analytics", desc: "Web-ready derivatives, compressed formats, access copies." },
  "Sensible oder eingeschränkte Daten": { icon: "visibility_off", desc: "Restricted access, PII, culturally sensitive materials.", isSensitive: true },
  "Betriebs- und Auditdaten": { icon: "manage_history", desc: "System logs, checksums, process documentation." }
} as const;

export const CATEGORIES = Object.keys(CATEGORY_DETAILS) as Array<keyof typeof CATEGORY_DETAILS>;
