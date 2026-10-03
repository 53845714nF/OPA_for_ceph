import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { diffLines, Change } from "diff";
import { fetchApi, useAuth } from "../context/AuthContext";
import { Artifact } from "../hooks/useArtifactSearch";

interface S3Version {
  version_id: string;
  is_latest: boolean;
  last_modified: string;
  size: number;
  etag: string;
}

interface VersionHistoryModalProps {
  artifact: (Artifact & { zones: string[] }) | null;
  onClose: () => void;
  onRollbackSuccess?: (message: string) => void;
  onOpenInEditor?: (artifact: Artifact & { zones: string[] }) => void;
}

export function VersionHistoryModal({
  artifact,
  onClose,
  onRollbackSuccess,
  onOpenInEditor,
}: VersionHistoryModalProps) {
  const { t, i18n } = useTranslation();
  const { role } = useAuth();
  const canRollback = role === "admin" || role === "curator";

  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [versions, setVersions] = useState<S3Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<S3Version | null>(null);

  // Content states for preview and diff
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [latestContent, setLatestContent] = useState<string | null>(null);
  const [isTextArtifact, setIsTextArtifact] = useState(true);
  const [activeTab, setActiveTab] = useState<"preview" | "diff">("preview");

  // Rollback state
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackError, setRollbackError] = useState<string | null>(null);
  const [confirmRollbackVersion, setConfirmRollbackVersion] = useState<S3Version | null>(null);

  const [copiedVersionId, setCopiedVersionId] = useState<string | null>(null);

  // 1. Fetch versions list
  useEffect(() => {
    if (!artifact) return;

    let isMounted = true;
    setIsLoadingVersions(true);
    setVersions([]);
    setSelectedVersion(null);
    setSelectedContent(null);
    setLatestContent(null);

    async function loadVersions() {
      try {
        const url = `/artifacts/${encodeURIComponent(artifact!.bucket)}/${encodeURIComponent(artifact!.key)}/versions`;
        const res = await fetchApi(url);
        if (!res.ok) throw new Error("Versionsabruf fehlgeschlagen");
        const data = await res.json();
        if (isMounted) {
          const list: S3Version[] = data.versions || [];
          setVersions(list);
          if (list.length > 0) {
            setSelectedVersion(list[0]);
          }
        }
      } catch (err) {
        console.error("Error loading versions:", err);
      } finally {
        if (isMounted) setIsLoadingVersions(false);
      }
    }

    loadVersions();

    return () => {
      isMounted = false;
    };
  }, [artifact]);

  // 2. Fetch content for selected version
  useEffect(() => {
    if (!artifact || !selectedVersion) return;

    let isMounted = true;
    setIsLoadingContent(true);

    async function loadContent() {
      try {
        // Load selected version content
        const url = `/artifacts/${encodeURIComponent(artifact!.bucket)}/${encodeURIComponent(artifact!.key)}/content?version_id=${encodeURIComponent(selectedVersion!.version_id)}`;
        const res = await fetchApi(url);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsTextArtifact(data.is_text);
            setSelectedContent(data.content);
          }
        }

        // If not already fetched, load latest version content for diffing
        if (!latestContent && versions.length > 0) {
          const latest = versions.find((v) => v.is_latest) || versions[0];
          const latestUrl = `/artifacts/${encodeURIComponent(artifact!.bucket)}/${encodeURIComponent(artifact!.key)}/content?version_id=${encodeURIComponent(latest.version_id)}`;
          const latestRes = await fetchApi(latestUrl);
          if (latestRes.ok) {
            const latestData = await latestRes.json();
            if (isMounted) {
              setLatestContent(latestData.content);
            }
          }
        }
      } catch (err) {
        console.error("Error loading version content:", err);
      } finally {
        if (isMounted) setIsLoadingContent(false);
      }
    }

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [artifact, selectedVersion, versions]);

  // 3. Compute Diff between selected version and latest version
  const diffResult = useMemo(() => {
    if (selectedContent === null || latestContent === null) return [];
    return diffLines(selectedContent, latestContent);
  }, [selectedContent, latestContent]);

  // Handle Rollback
  const handleRollback = async (version: S3Version) => {
    if (!artifact) return;
    setIsRollingBack(true);
    setRollbackError(null);

    try {
      const url = `/artifacts/${encodeURIComponent(artifact.bucket)}/${encodeURIComponent(artifact.key)}/rollback?version_id=${encodeURIComponent(version.version_id)}`;
      const res = await fetchApi(url, { method: "POST" });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Fehler beim Rollback der Version");
      }

      const data = await res.json().catch(() => ({}));
      setConfirmRollbackVersion(null);
      if (onRollbackSuccess) {
        onRollbackSuccess(data.message || `Erfolgreich auf Version ${version.version_id.substring(0, 8)}... zurückgesetzt.`);
      }
      onClose();
    } catch (err: any) {
      setRollbackError(err.message || "Rollback fehlgeschlagen");
    } finally {
      setIsRollingBack(false);
    }
  };

  const copyVersionId = (vid: string) => {
    navigator.clipboard.writeText(vid);
    setCopiedVersionId(vid);
    setTimeout(() => setCopiedVersionId(null), 2000);
  };

  if (!artifact) return null;

  const isYaml = Boolean(
    artifact.is_yaml ||
    artifact.key.toLowerCase().endsWith(".yml") ||
    artifact.key.toLowerCase().endsWith(".yaml") ||
    artifact.bucket === "metadata-manifests"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface border border-outline-variant max-w-5xl w-full h-[90vh] max-h-[850px] shadow-2xl flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">history</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-ebGaramond text-headline-sm text-primary leading-none">
                  {t("archive.versionHistoryTitle", "Versionshistorie & Provenienz")}
                </h3>
                <span className="bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 text-[10px] font-hankenGrotesk uppercase tracking-wider font-semibold">
                  {versions.length} {versions.length === 1 ? "Version" : "Versionen"}
                </span>
                <span className="bg-surface-container text-on-surface-variant border border-outline-variant px-1.5 py-0.5 text-[10px] font-data-mono uppercase">
                  Bucket: {artifact.bucket}
                </span>
              </div>
              <p className="font-data-mono text-xs text-on-surface-variant mt-1 flex items-center gap-2">
                <span className="font-bold text-on-surface">{artifact.key}</span>
                <span className="text-outline-variant">·</span>
                <span>Zonen: {artifact.zones.join(", ")}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body Split-View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-surface-container-lowest">
          {/* Left Panel: Versions Timeline */}
          <div className="w-full md:w-80 border-r border-outline-variant/50 bg-surface-container-low flex flex-col overflow-y-auto">
            <div className="p-3 border-b border-outline-variant/40 bg-surface text-xs font-hankenGrotesk uppercase tracking-wider text-outline font-semibold flex items-center justify-between">
              <span>Chronologische Stände</span>
              <span className="text-[10px] font-data-mono font-normal">S3 Object Lock</span>
            </div>

            {isLoadingVersions ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-outline">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                <span className="text-xs font-hankenGrotesk">Lade Versionen...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="p-6 text-center text-outline text-xs font-hankenGrotesk">
                Keine Versionen gefunden.
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/30">
                {versions.map((ver, idx) => {
                  const versionNum = versions.length - idx;
                  const isSelected = selectedVersion?.version_id === ver.version_id;

                  return (
                    <div
                      key={ver.version_id}
                      onClick={() => setSelectedVersion(ver)}
                      className={`p-3.5 transition-colors cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? "bg-primary/10 border-l-4 border-l-primary"
                          : "hover:bg-surface-container border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-data-mono text-xs font-bold ${isSelected ? "text-primary" : "text-on-surface"}`}>
                            v{versionNum}
                          </span>
                          {ver.is_latest && (
                            <span className="px-1.5 py-0.2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-hankenGrotesk uppercase tracking-wider font-semibold">
                              Aktuell (Latest)
                            </span>
                          )}
                        </div>
                        <span className="font-data-mono text-[11px] text-outline">
                          {(ver.size / 1024).toFixed(1)} KB
                        </span>
                      </div>

                      <div className="text-[11px] font-hankenGrotesk text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-outline">schedule</span>
                        <span>{new Date(ver.last_modified).toLocaleString(i18n.language)}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span
                          className="font-data-mono text-[10px] text-outline hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyVersionId(ver.version_id);
                          }}
                          title="Version-ID kopieren"
                        >
                          <span className="truncate max-w-[120px]">{ver.version_id}</span>
                          <span className="material-symbols-outlined text-[12px]">
                            {copiedVersionId === ver.version_id ? "check" : "content_copy"}
                          </span>
                        </span>

                        {!ver.is_latest && canRollback && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmRollbackVersion(ver);
                            }}
                            className="text-[10px] font-hankenGrotesk uppercase tracking-wider text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[12px]">replay</span>
                            Rollback
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: Content / Diff Inspector */}
          <div className="flex-1 flex flex-col overflow-hidden bg-surface">
            {selectedVersion && (
              <>
                {/* Inspector Toolbar */}
                <div className="px-5 py-3 border-b border-outline-variant/40 bg-surface flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-data-mono font-bold text-on-surface">
                      v{versions.length - versions.findIndex((v) => v.version_id === selectedVersion.version_id)}
                      {selectedVersion.is_latest ? " (Aktueller Stand)" : " (Historischer Stand)"}
                    </span>
                    <span className="text-outline">·</span>
                    <span className="font-data-mono text-outline text-[11px]">
                      {new Date(selectedVersion.last_modified).toLocaleString(i18n.language)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Tabs for text/yaml artifacts */}
                    {isTextArtifact && (
                      <div className="flex border border-outline bg-surface-container-low p-0.5 text-xs font-hankenGrotesk uppercase tracking-wider">
                        <button
                          type="button"
                          onClick={() => setActiveTab("preview")}
                          className={`px-3 py-1 transition-colors font-medium cursor-pointer ${
                            activeTab === "preview"
                              ? "bg-surface text-primary shadow-xs font-semibold"
                              : "text-on-surface-variant hover:text-on-surface"
                          }`}
                        >
                          Inhalt
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("diff")}
                          disabled={selectedVersion.is_latest}
                          className={`px-3 py-1 transition-colors font-medium flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            activeTab === "diff"
                              ? "bg-surface text-primary shadow-xs font-semibold"
                              : "text-on-surface-variant hover:text-on-surface"
                          }`}
                          title={selectedVersion.is_latest ? "Diff nur für frühere Versionen verfügbar" : "Unterschiede zum aktuellen Stand vergleichen"}
                        >
                          <span className="material-symbols-outlined text-[13px]">difference</span>
                          Diff (Vergleich)
                        </button>
                      </div>
                    )}

                    {/* Open in YAML Editor shortcut */}
                    {isYaml && onOpenInEditor && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenInEditor(artifact);
                        }}
                        className="px-2.5 py-1 text-xs font-hankenGrotesk uppercase tracking-wider border border-outline hover:bg-surface-container text-on-surface flex items-center gap-1 transition-colors cursor-pointer"
                        title="Im interaktiven YAML-Editor öffnen"
                      >
                        <span className="material-symbols-outlined text-[13px]">edit_note</span>
                        Editor
                      </button>
                    )}

                    {/* Rollback button */}
                    {!selectedVersion.is_latest && canRollback && (
                      <button
                        type="button"
                        onClick={() => setConfirmRollbackVersion(selectedVersion)}
                        className="px-3 py-1 bg-primary/10 text-primary border border-primary/40 hover:bg-primary/20 text-xs font-hankenGrotesk uppercase tracking-wider font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Diesen Versionsstand als neuen aktuellen Stand wiederherstellen"
                      >
                        <span className="material-symbols-outlined text-[14px]">replay</span>
                        Wiederherstellen
                      </button>
                    )}
                  </div>
                </div>

                {/* Rollback Error Alert */}
                {rollbackError && (
                  <div className="px-5 py-2.5 bg-error-container text-on-error-container text-xs font-hankenGrotesk border-b border-error/40 flex items-center justify-between">
                    <span>{rollbackError}</span>
                    <button onClick={() => setRollbackError(null)} className="text-on-error-container hover:opacity-75">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 relative overflow-auto p-4 bg-surface-container-lowest font-data-mono text-xs">
                  {isLoadingContent ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-outline">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                      <span className="font-hankenGrotesk text-xs">Lade Versionsdaten aus Ceph S3...</span>
                    </div>
                  ) : !isTextArtifact ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-outline">image</span>
                      <p className="font-ebGaramond text-headline-sm text-on-surface">Binäre Datei / Bild</p>
                      <p className="font-hankenGrotesk text-xs text-outline max-w-md">
                        Version {selectedVersion.version_id.substring(0, 16)}... ({selectedVersion.size} Bytes).
                        Binäre Bilddaten werden in Ceph S3 als unveränderliche Versionen historisiert.
                      </p>
                    </div>
                  ) : activeTab === "diff" ? (
                    /* Diff View */
                    <div className="space-y-1">
                      <div className="p-2 mb-3 bg-surface-container-low border border-outline-variant/50 text-[11px] font-hankenGrotesk text-on-surface-variant flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 bg-emerald-500/70 border border-emerald-600"></span>
                          <span>Neu im aktuellen Stand hinzugefügt</span>
                          <span className="inline-block w-2.5 h-2.5 bg-error/70 border border-error ml-3"></span>
                          <span>In diesem historischen Stand vorhanden (entfernt/geändert)</span>
                        </div>
                        <span className="font-data-mono text-[10px]">
                          Vergleich: Version v{versions.length - versions.findIndex((v) => v.version_id === selectedVersion.version_id)} ➔ Aktuell
                        </span>
                      </div>

                      <div className="border border-outline-variant/40 divide-y divide-outline-variant/20 bg-surface">
                        {diffResult.map((part: Change, i: number) => {
                          const isAdded = part.added;
                          const isRemoved = part.removed;
                          const bg = isAdded
                            ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                            : isRemoved
                            ? "bg-error/10 text-error"
                            : "text-on-surface/80";

                          return (
                            <div key={i} className={`px-3 py-1 font-data-mono text-xs whitespace-pre-wrap leading-[20px] ${bg}`}>
                              {part.value}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Raw Content Preview with Line Numbers */
                    <div className="border border-outline-variant/40 bg-surface flex">
                      <div className="w-10 py-3 bg-surface-container-low border-r border-outline-variant/30 text-right pr-2 text-outline-variant select-none">
                        {(selectedContent || "").split("\n").map((_, i) => (
                          <div key={i} className="leading-[20px]">{i + 1}</div>
                        ))}
                      </div>
                      <div className="flex-1 p-3 overflow-x-auto whitespace-pre leading-[20px] text-on-surface">
                        {selectedContent || "(Leer)"}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-outline-variant/50 bg-surface-container-low flex items-center justify-between text-xs font-hankenGrotesk">
          <span className="text-outline">
            S3 Object Lock Versioning aktiv · WORM-Compliance garantiert Unveränderbarkeit
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-outline text-on-surface hover:bg-surface-container text-label-md uppercase tracking-wider transition-colors cursor-pointer"
          >
            {t("archive.deleteCancelButton", "Schließen")}
          </button>
        </div>

        {/* Confirmation Modal for Rollback */}
        {confirmRollbackVersion && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-surface border border-outline-variant max-w-md w-full p-6 shadow-2xl relative">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">replay</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-ebGaramond text-headline-sm text-primary mb-1">
                    Auf frühere Version zurücksetzen?
                  </h3>
                  <p className="font-hankenGrotesk text-body-sm text-on-surface-variant mb-4">
                    Möchten Sie das Artefakt „<strong>{artifact.key}</strong>“ auf den Stand vom{" "}
                    <strong>{new Date(confirmRollbackVersion.last_modified).toLocaleString(i18n.language)}</strong>{" "}
                    zurücksetzen?
                  </p>
                  <p className="font-hankenGrotesk text-xs text-outline mb-4 bg-surface-container-low p-2.5 border border-outline-variant">
                    Hinweis: Der bestehende aktuelle Stand wird dabei nicht gelöscht, sondern als neuer Versionsschritt in Ceph S3 abgelegt.
                  </p>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setConfirmRollbackVersion(null)}
                      disabled={isRollingBack}
                      className="px-4 py-2 border border-outline text-on-surface hover:bg-surface-container font-hankenGrotesk text-label-md uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {t("archive.deleteCancelButton", "Abbrechen")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRollback(confirmRollbackVersion)}
                      disabled={isRollingBack}
                      className="px-4 py-2 bg-primary text-on-primary font-hankenGrotesk text-label-md uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm font-semibold cursor-pointer"
                    >
                      {isRollingBack ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-on-primary border-t-transparent"></div>
                          <span>Setze zurück...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">replay</span>
                          <span>Stand wiederherstellen</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
