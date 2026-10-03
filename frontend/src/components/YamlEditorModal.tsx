import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import YAML from "yaml";
import { diffLines, Change } from "diff";
import { fetchApi } from "../context/AuthContext";
import { Artifact } from "../hooks/useArtifactSearch";

interface S3Version {
  version_id: string;
  is_latest: boolean;
  last_modified: string;
  size: number;
}

interface YamlEditorModalProps {
  artifact: (Artifact & { zones: string[] }) | null;
  onClose: () => void;
  onSaved: (message?: string) => void;
}

export function YamlEditorModal({ artifact, onClose, onSaved }: YamlEditorModalProps) {
  const { t, i18n } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [yamlText, setYamlText] = useState("");
  const [originalYamlText, setOriginalYamlText] = useState("");
  const [latestYamlText, setLatestYamlText] = useState("");
  const [newKey, setNewKey] = useState("");
  const [accessionId, setAccessionId] = useState("");

  const [yamlError, setYamlError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Versions states
  const [versions, setVersions] = useState<S3Version[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Load versions & initial latest content
  useEffect(() => {
    if (!artifact) return;

    let isMounted = true;
    setIsLoading(true);
    setFetchError(null);
    setSaveError(null);
    setNewKey(artifact.key);
    setAccessionId(artifact.accession_id === "N/A" ? "" : artifact.accession_id);
    setShowDiff(false);

    async function loadData() {
      try {
        // 1. Fetch versions list
        const versUrl = `/artifacts/${encodeURIComponent(artifact!.bucket)}/${encodeURIComponent(artifact!.key)}/versions`;
        const versRes = await fetchApi(versUrl);
        if (versRes.ok) {
          const versData = await versRes.json();
          if (isMounted) {
            const vList: S3Version[] = versData.versions || [];
            setVersions(vList);
            if (vList.length > 0) {
              setSelectedVersionId(vList[0].version_id);
            }
          }
        }

        // 2. Fetch latest content
        const url = `/artifacts/${encodeURIComponent(artifact!.bucket)}/${encodeURIComponent(artifact!.key)}/content`;
        const res = await fetchApi(url);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Fehler beim Laden (${res.status})`);
        }

        const data = await res.json();
        if (isMounted) {
          const content = data.content || "";
          setYamlText(content);
          setOriginalYamlText(content);
          setLatestYamlText(content);
          validateYaml(content);
        }
      } catch (err: any) {
        if (isMounted) {
          setFetchError(err.message || "Fehler beim Laden des Dateiinhalts");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [artifact]);

  // Load specific version content when user selects a different version
  const handleVersionChange = async (verId: string) => {
    if (!artifact) return;
    setSelectedVersionId(verId);
    setIsLoading(true);
    setFetchError(null);

    try {
      const url = `/artifacts/${encodeURIComponent(artifact.bucket)}/${encodeURIComponent(artifact.key)}/content?version_id=${encodeURIComponent(verId)}`;
      const res = await fetchApi(url);
      if (!res.ok) throw new Error("Fehler beim Laden der ausgewählten Version");
      const data = await res.json();
      const content = data.content || "";
      setYamlText(content);
      setOriginalYamlText(content);
      validateYaml(content);
    } catch (err: any) {
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentVersion = useMemo(() => {
    if (!selectedVersionId || versions.length === 0) return true;
    const latest = versions.find((v) => v.is_latest) || versions[0];
    return selectedVersionId === latest.version_id;
  }, [selectedVersionId, versions]);

  const validateYaml = (text: string) => {
    if (!text.trim()) {
      setYamlError(null);
      return true;
    }
    try {
      YAML.parse(text);
      setYamlError(null);
      return true;
    } catch (err: any) {
      setYamlError(err.message);
      return false;
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setYamlText(val);
    validateYaml(val);
  };

  // Synchronize scrolling between line numbers and textarea
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Support Tab key indentation (2 spaces)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;

      const updated = val.substring(0, start) + "  " + val.substring(end);
      setYamlText(updated);
      validateYaml(updated);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  // Auto-format YAML
  const handleFormat = () => {
    try {
      const parsed = YAML.parse(yamlText);
      const formatted = YAML.stringify(parsed, { indent: 2 });
      setYamlText(formatted);
      validateYaml(formatted);
    } catch (err: any) {
      setYamlError(err.message);
    }
  };

  // Reset to original content
  const handleReset = () => {
    setYamlText(originalYamlText);
    validateYaml(originalYamlText);
    if (artifact) {
      setNewKey(artifact.key);
      setAccessionId(artifact.accession_id === "N/A" ? "" : artifact.accession_id);
    }
  };

  // Line numbers calculation
  const lineCount = useMemo(() => {
    return Math.max(1, yamlText.split("\n").length);
  }, [yamlText]);

  // Compute Diff between current editor text and latest saved text
  const diffResult = useMemo(() => {
    if (!showDiff) return [];
    return diffLines(yamlText, latestYamlText);
  }, [showDiff, yamlText, latestYamlText]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artifact) return;

    if (!validateYaml(yamlText)) {
      setSaveError(t("archive.yamlInvalid") + ": " + (yamlError || ""));
      return;
    }

    if (!newKey.trim()) {
      setSaveError(t("archive.fileName") + " ist erforderlich.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.append("bucket", artifact.bucket);
      formData.append("old_key", artifact.key);
      formData.append("new_key", newKey.trim());
      formData.append("accession_id", accessionId.trim());
      formData.append("content_text", yamlText);

      const res = await fetchApi("/edit-data", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg =
          errData.detail?.violations?.join(", ") ||
          errData.detail?.message ||
          errData.detail ||
          t("archive.editError");
        throw new Error(msg);
      }

      const resData = await res.json().catch(() => ({}));
      onSaved(resData.message || t("archive.yamlSuccess"));
    } catch (err: any) {
      setSaveError(err.message || t("archive.editError"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!artifact) return null;

  const isDirty = yamlText !== originalYamlText || newKey !== artifact.key || accessionId !== (artifact.accession_id === "N/A" ? "" : artifact.accession_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface border border-outline-variant max-w-4xl w-full h-[90vh] max-h-[850px] shadow-2xl flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">description</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-ebGaramond text-headline-sm text-primary leading-none">
                  {t("archive.yamlEditorTitle")}
                </h3>
                <span className="bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 text-[10px] font-hankenGrotesk uppercase tracking-wider font-semibold">
                  YAML Manifest
                </span>
                {versions.length > 0 && (
                  <span className="bg-surface-container text-on-surface-variant border border-outline-variant px-1.5 py-0.5 text-[10px] font-hankenGrotesk uppercase tracking-wider flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[12px]">history</span>
                    {versions.length} {versions.length === 1 ? "Version" : "Versionen"}
                  </span>
                )}
              </div>
              <p className="font-data-mono text-xs text-on-surface-variant mt-1 flex items-center gap-2">
                <span>{artifact.bucket}</span>
                <span className="text-outline-variant">/</span>
                <span className="font-bold text-on-surface">{artifact.key}</span>
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

        {/* Toolbar & Metadata Row */}
        <div className="px-6 py-3 border-b border-outline-variant/40 bg-surface flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            {/* Version Switcher Dropdown */}
            {versions.length > 1 && (
              <div className="flex items-center gap-1.5 bg-surface-container-low px-2 py-1 border border-outline">
                <span className="material-symbols-outlined text-[14px] text-primary">history</span>
                <label className="font-hankenGrotesk uppercase text-[10px] tracking-wider text-outline font-medium whitespace-nowrap">
                  Stand:
                </label>
                <select
                  value={selectedVersionId || ""}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  className="bg-transparent font-data-mono text-xs text-primary font-bold focus:outline-none cursor-pointer"
                >
                  {versions.map((ver, idx) => {
                    const verNum = versions.length - idx;
                    const dateStr = new Date(ver.last_modified).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
                    return (
                      <option key={ver.version_id} value={ver.version_id} className="bg-surface text-on-surface font-normal">
                        v{verNum} {ver.is_latest ? "(Aktuell)" : `(${dateStr})`}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 flex-1">
              <label className="font-hankenGrotesk uppercase text-[10px] tracking-wider text-outline font-medium whitespace-nowrap">
                {t("archive.fileName")}:
              </label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="manifest.yml"
                className="w-full px-2 py-1 bg-surface-container-lowest border border-outline focus:border-primary font-data-mono text-xs text-on-surface rounded-none"
              />
            </div>
            <div className="flex items-center gap-1.5 w-36">
              <label className="font-hankenGrotesk uppercase text-[10px] tracking-wider text-outline font-medium whitespace-nowrap">
                ID:
              </label>
              <input
                type="text"
                value={accessionId}
                onChange={(e) => setAccessionId(e.target.value)}
                placeholder="Accession-ID"
                className="w-full px-2 py-1 bg-surface-container-lowest border border-outline focus:border-primary font-data-mono text-xs text-on-surface rounded-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Diff Toggle if historical version or edited */}
            {versions.length > 1 && (
              <button
                type="button"
                onClick={() => setShowDiff(!showDiff)}
                className={`px-2.5 py-1 text-xs font-hankenGrotesk uppercase tracking-wider border transition-colors flex items-center gap-1 cursor-pointer ${
                  showDiff
                    ? "bg-primary text-on-primary border-primary font-semibold"
                    : "border-outline hover:bg-surface-container text-on-surface"
                }`}
                title="Unterschiede zum aktuellen Stand anzeigen"
              >
                <span className="material-symbols-outlined text-[14px]">difference</span>
                <span>Diff</span>
              </button>
            )}

            {/* Format Button */}
            <button
              type="button"
              onClick={handleFormat}
              disabled={isLoading || !!yamlError}
              className="px-2.5 py-1 text-xs font-hankenGrotesk uppercase tracking-wider border border-outline hover:bg-surface-container text-on-surface flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
              title="YAML automatisch einrücken und formatieren"
            >
              <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
              <span>{t("archive.yamlFormat")}</span>
            </button>

            {/* Reset Button */}
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="px-2.5 py-1 text-xs font-hankenGrotesk uppercase tracking-wider border border-outline hover:bg-surface-container text-on-surface flex items-center gap-1 transition-colors cursor-pointer"
                title="Auf Originalinhalt zurücksetzen"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                <span>Zurücksetzen</span>
              </button>
            )}

            {/* Status indicator */}
            {!yamlError ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-hankenGrotesk uppercase tracking-wider font-semibold">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                {t("archive.yamlValid")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-error/10 text-error border border-error/30 text-[11px] font-hankenGrotesk uppercase tracking-wider font-semibold" title={yamlError}>
                <span className="material-symbols-outlined text-[14px]">warning</span>
                {t("archive.yamlInvalid")}
              </span>
            )}
          </div>
        </div>

        {/* Historical Version Notice Banner */}
        {!isCurrentVersion && (
          <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-hankenGrotesk flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>
                Sie betrachten einen historischen Versionsstand. Speichern aktiviert diesen Inhalt als <strong>neue aktuelle Version</strong> in Ceph S3.
              </span>
            </div>
            {versions.length > 0 && (
              <button
                type="button"
                onClick={() => handleVersionChange(versions[0].version_id)}
                className="text-primary hover:underline font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider cursor-pointer"
              >
                Zum aktuellen Stand zurückkehren
              </button>
            )}
          </div>
        )}

        {/* Syntax Error Banner */}
        {yamlError && (
          <div className="px-6 py-2 bg-error/10 border-b border-error/30 text-error text-xs font-data-mono flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] mt-0.5 flex-shrink-0">error_outline</span>
            <div className="flex-1 overflow-x-auto whitespace-pre-wrap">{yamlError}</div>
          </div>
        )}

        {/* Save Error Banner */}
        {saveError && (
          <div className="px-6 py-2.5 bg-error-container text-on-error-container text-xs font-hankenGrotesk border-b border-error/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span>{saveError}</span>
            </div>
            <button onClick={() => setSaveError(null)} className="text-on-error-container hover:opacity-75">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Editor / Diff Body */}
        <div className="flex-1 relative overflow-hidden bg-surface-container-lowest flex">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
              <p className="font-hankenGrotesk text-xs uppercase tracking-wider text-outline">
                Lade YAML-Inhalt aus Ceph Storage...
              </p>
            </div>
          ) : fetchError ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3">
              <span className="material-symbols-outlined text-4xl text-error">cloud_off</span>
              <p className="font-ebGaramond text-headline-sm text-error">{fetchError}</p>
              <button
                onClick={() => setFetchError(null)}
                className="px-4 py-2 border border-outline hover:bg-surface-container text-xs font-hankenGrotesk uppercase tracking-wider"
              >
                Erneut versuchen
              </button>
            </div>
          ) : showDiff ? (
            /* Diff View Mode */
            <div className="w-full h-full p-4 overflow-auto font-data-mono text-xs">
              <div className="p-2 mb-3 bg-surface-container-low border border-outline-variant/50 text-[11px] font-hankenGrotesk text-on-surface-variant flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 bg-emerald-500/70 border border-emerald-600"></span>
                    <span>Aktueller Stand (Neu)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 bg-error/70 border border-error"></span>
                    <span>Ausgewählter Stand (Entfernt/Geändert)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDiff(false)}
                  className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  Diff schließen
                </button>
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
                    <div key={i} className={`px-3 py-1 whitespace-pre-wrap leading-[20px] ${bg}`}>
                      {part.value}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Standard Code Editor with Line Numbers */
            <div className="w-full h-full flex overflow-hidden">
              <div
                ref={lineNumbersRef}
                className="w-12 py-3 bg-surface-container-low border-r border-outline-variant/50 select-none overflow-hidden text-right pr-2.5 font-data-mono text-xs text-outline-variant/60 leading-[20px]"
                aria-hidden="true"
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              <div className="flex-1 relative h-full">
                <textarea
                  ref={textareaRef}
                  value={yamlText}
                  onChange={handleTextChange}
                  onScroll={handleScroll}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  className="w-full h-full p-3 font-data-mono text-xs leading-[20px] bg-transparent text-on-surface resize-none focus:outline-none focus:ring-0 border-0 whitespace-pre overflow-auto"
                  placeholder="heritage_archive_record:&#10;  key: value"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-outline-variant/50 bg-surface-container-low flex items-center justify-between">
          <div className="font-data-mono text-[11px] text-outline flex items-center gap-3">
            <span>Zeilen: {lineCount}</span>
            <span>·</span>
            <span>Größe: {new Blob([yamlText]).size} Bytes</span>
            {isDirty && (
              <>
                <span>·</span>
                <span className="text-primary font-medium">Ungespeicherte Änderungen</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-outline text-on-surface hover:bg-surface-container font-hankenGrotesk text-label-md uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t("archive.deleteCancelButton")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading || !!yamlError}
              className="px-5 py-2 bg-primary text-on-primary font-hankenGrotesk text-label-md uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-40 cursor-pointer font-semibold"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-on-primary border-t-transparent"></div>
                  <span>{t("archive.saving")}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{t("archive.yamlSave")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
