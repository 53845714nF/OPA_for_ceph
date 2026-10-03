import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useArtifactSearch, Artifact } from "../hooks/useArtifactSearch";
import { useAuth, fetchApi } from "../context/AuthContext";
import { YamlEditorModal } from "../components/YamlEditorModal";
import { VersionHistoryModal } from "../components/VersionHistoryModal";

export function Archive() {
  const { t, i18n } = useTranslation();
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const canEdit = role === "admin" || role === "curator";
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [artifactToDelete, setArtifactToDelete] = useState<(Artifact & { zones: string[] }) | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Edit / Rename states
  const [artifactToEdit, setArtifactToEdit] = useState<(Artifact & { zones: string[] }) | null>(null);
  const [artifactToEditYaml, setArtifactToEditYaml] = useState<(Artifact & { zones: string[] }) | null>(null);
  const [artifactForVersions, setArtifactForVersions] = useState<(Artifact & { zones: string[] }) | null>(null);
  const [editNewKey, setEditNewKey] = useState("");
  const [editAccessionId, setEditAccessionId] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [promoteToMaster, setPromoteToMaster] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  
  const { data: artifacts, isLoading, isError } = useArtifactSearch(activeQuery);

  const handleOpenEdit = (artifact: Artifact & { zones: string[] }) => {
    setArtifactToEdit(artifact);
    setEditNewKey(artifact.key);
    setEditAccessionId(artifact.accession_id === "N/A" ? "" : artifact.accession_id);
    setEditFile(null);
    setPromoteToMaster(false);
    setEditError(null);
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artifactToEdit) return;
    if (!editNewKey.trim()) {
      setEditError(t("archive.fileName") + " ist erforderlich.");
      return;
    }

    setIsEditing(true);
    setEditError(null);

    try {
      const formData = new FormData();
      formData.append("bucket", artifactToEdit.bucket);
      formData.append("old_key", artifactToEdit.key);
      formData.append("new_key", editNewKey.trim());
      formData.append("accession_id", editAccessionId.trim());
      if (promoteToMaster) {
        formData.append("promote_to_master", "true");
        formData.append("target_bucket", "curated-master");
      }
      if (editFile) {
        formData.append("file", editFile);
      }

      const res = await fetchApi("/edit-data", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg =
          errorData.detail?.violations?.join(", ") ||
          errorData.detail?.message ||
          errorData.detail ||
          t("archive.editError");
        throw new Error(errorMsg);
      }

      await queryClient.invalidateQueries({ queryKey: ["artifactSearch"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });

      setEditSuccess(promoteToMaster ? t("archive.promoteSuccess") : t("archive.editSuccess"));
      setArtifactToEdit(null);
      setTimeout(() => setEditSuccess(null), 5000);
    } catch (err: any) {
      setEditError(err.message || t("archive.editError"));
    } finally {
      setIsEditing(false);
    }
  };

  // Group artifacts by key and bucket to show multiple locations
  const groupedArtifacts = useMemo(() => {
    if (!artifacts) return [];
    
    const groups: Record<string, Artifact & { zones: string[] }> = {};
    
    artifacts.forEach(artifact => {
      const id = `${artifact.bucket}/${artifact.key}`;
      if (!groups[id]) {
        groups[id] = { ...artifact, zones: [artifact.zone] };
      } else {
        if (!groups[id].zones.includes(artifact.zone)) {
          groups[id].zones.push(artifact.zone);
        }
      }
    });
    
    return Object.values(groups);
  }, [artifacts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchQuery);
  };

  const handleConfirmDelete = async () => {
    if (!artifactToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetchApi(
        `/delete-data?bucket=${encodeURIComponent(artifactToDelete.bucket)}&key=${encodeURIComponent(artifactToDelete.key)}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg =
          errorData.detail?.violations?.join(", ") ||
          errorData.detail?.message ||
          errorData.detail ||
          t("archive.deleteError");
        throw new Error(errorMsg);
      }

      await queryClient.invalidateQueries({ queryKey: ["artifactSearch"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });

      setDeleteSuccess(t("archive.deleteSuccess"));
      setArtifactToDelete(null);
      setTimeout(() => setDeleteSuccess(null), 5000);
    } catch (err: any) {
      setDeleteError(err.message || t("archive.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Search Hero Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-12 border-b border-outline-variant bg-surface-container-lowest">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-ebGaramond text-display-lg text-primary mb-6 text-center">
            {t("archive.searchTitle")}
          </h2>
          <form onSubmit={handleSearch} className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-4 text-outline z-10">search</span>
            <input 
              type="text" 
              placeholder={t("archive.searchPlaceholder")} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-16 py-4 bg-transparent border-0 border-b-2 border-outline focus:border-primary focus:ring-0 font-hankenGrotesk text-body-lg text-on-surface placeholder:text-outline-variant transition-colors rounded-none"
            />
            <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-primary font-hankenGrotesk text-label-md uppercase hover:bg-surface-container p-2 transition-colors">
              {t("archive.searchButton")}
            </button>
          </form>
          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            <span className="font-hankenGrotesk text-data-mono text-outline uppercase flex items-center mt-1">
              {t("archive.suggested")}
            </span>
            <button onClick={() => { setSearchQuery("raw"); setActiveQuery("raw"); }} className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-container px-3 py-1 hover:bg-outline-variant hover:text-on-primary transition-colors">
              {t("archive.rawData")}
            </button>
            <span className="text-outline-variant text-[10px] mt-1">◆</span>
            <button onClick={() => { setSearchQuery("manifest"); setActiveQuery("manifest"); }} className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-container px-3 py-1 hover:bg-outline-variant hover:text-on-primary transition-colors">
              {t("archive.manifests")}
            </button>
            <span className="text-outline-variant text-[10px] mt-1">◆</span>
            <button onClick={() => { setSearchQuery(".png"); setActiveQuery(".png"); }} className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-container px-3 py-1 hover:bg-outline-variant hover:text-on-primary transition-colors">
              {t("archive.images")}
            </button>
          </div>
        </div>
      </section>

      {/* Main Layout: Sidebar + Grid */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-container-max mx-auto">
        {/* Filter Sidebar */}
        <aside className="w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-outline-variant p-margin-mobile md:p-8 bg-surface-container-lowest">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-hankenGrotesk text-label-md uppercase text-on-surface tracking-wider">
              {t("archive.refineResults")}
            </h3>
            <button onClick={() => { setSearchQuery(""); setActiveQuery(""); }} className="text-outline hover:text-primary transition-colors font-hankenGrotesk text-data-mono">
              {t("common.clearAll")}
            </button>
          </div>

          <div className="mb-8">
            <h4 className="font-ebGaramond text-headline-md text-primary mb-4 border-b border-outline-variant/50 pb-2">
              {t("archive.status")}
            </h4>
            <div className="p-4 bg-surface-container-low border border-outline-variant text-sm font-hankenGrotesk text-on-surface-variant">
              {isLoading 
                ? t("archive.searchingZones") 
                : isError 
                  ? t("archive.errorFetching") 
                  : t("archive.foundItems_other", { count: groupedArtifacts.length })}
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <section className="flex-1 p-margin-mobile md:p-8 bg-background">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <p className="font-hankenGrotesk text-body-md text-on-surface-variant">
              {activeQuery ? (
                <>
                  {t("archive.showingResults", { count: groupedArtifacts.length, query: activeQuery })}
                </>
              ) : (
                <>
                  {t("archive.browseAll", { count: groupedArtifacts.length })}
                </>
              )}
            </p>
          </div>

          {/* Delete Success Alert */}
          {deleteSuccess && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary text-primary flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2 font-hankenGrotesk text-body-md font-medium">
                <span className="material-symbols-outlined">check_circle</span>
                <span>{deleteSuccess}</span>
              </div>
              <button onClick={() => setDeleteSuccess(null)} className="text-primary hover:opacity-75">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* Edit Success Alert */}
          {editSuccess && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary text-primary flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2 font-hankenGrotesk text-body-md font-medium">
                <span className="material-symbols-outlined">check_circle</span>
                <span>{editSuccess}</span>
              </div>
              <button onClick={() => setEditSuccess(null)} className="text-primary hover:opacity-75">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedArtifacts.map((artifact, index) => {
                const isYaml = Boolean(
                  artifact.is_yaml ||
                  artifact.key.toLowerCase().endsWith(".yml") ||
                  artifact.key.toLowerCase().endsWith(".yaml") ||
                  artifact.bucket === "metadata-manifests"
                );

                return (
                <article key={index} className="archival-card group bg-surface-container-lowest border border-outline-variant flex flex-col relative overflow-hidden min-h-[490px] h-full">
                  <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
                    {artifact.zones.map(zone => (
                      <span key={zone} className="bg-surface-container-lowest/95 backdrop-blur-md text-on-surface font-medium px-2 py-1 border border-outline-variant shadow-sm text-[10px] font-hankenGrotesk uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-primary">location_on</span> {zone}
                      </span>
                    ))}
                    {artifact.zones.length > 1 && (
                      <span className="bg-primary text-on-primary font-semibold px-2 py-1 shadow-md border border-primary text-[10px] font-hankenGrotesk uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">sync</span>
                        {t("archive.multiZone")}
                      </span>
                    )}
                  </div>
                  <div className="h-48 w-full relative border-b border-outline-variant/50 p-2 bg-surface-container-low flex items-center justify-center overflow-hidden">
                    {isYaml ? (
                      <div className="w-full h-full p-4 flex flex-col justify-between bg-surface-container-lowest border border-outline-variant/40 shadow-inner group-hover:border-primary/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-data-mono text-[11px] font-bold text-primary flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">description</span>
                            YAML Manifest
                          </span>
                          <span className="bg-primary/10 text-primary text-[10px] font-data-mono font-bold px-1.5 py-0.5 border border-primary/30 uppercase tracking-widest">
                            .YML
                          </span>
                        </div>
                        <div className="font-data-mono text-[10px] text-on-surface-variant/80 bg-surface-container-low/70 p-2 border border-outline-variant/30 space-y-0.5 overflow-hidden">
                          <div className="text-primary/70">heritage_archive_record:</div>
                          <div className="pl-2 truncate">file: <span className="text-on-surface font-semibold">{artifact.key.replace(/\.ya?ml$/, '')}</span></div>
                          <div className="pl-2 truncate">id: <span className="text-primary font-semibold">{artifact.accession_id}</span></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-hankenGrotesk text-outline uppercase tracking-wider">
                          <span>Maschinenlesbar</span>
                          <span className="text-primary flex items-center gap-0.5 font-semibold">
                            <span className="material-symbols-outlined text-[12px]">code</span> YAML
                          </span>
                        </div>
                      </div>
                    ) : artifact.preview_url ? (
                      <img 
                        src={artifact.preview_url} 
                        alt={artifact.key} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    {!isYaml && (
                      <span className={`fallback-icon material-symbols-outlined text-display-lg text-outline-variant/30 ${artifact.preview_url ? 'hidden' : ''}`}>
                        description
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-hankenGrotesk text-[10px] uppercase tracking-widest text-outline">
                          {t("archive.accessionId")}
                        </span>
                        <p className="font-data-mono text-xs text-primary font-bold">{artifact.accession_id}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Version Badge */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setArtifactForVersions(artifact);
                          }}
                          className={`font-hankenGrotesk text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 border transition-all flex items-center gap-1 cursor-pointer ${
                            (artifact.version_count || 1) > 1
                              ? "bg-primary/10 text-primary border-primary/40 hover:bg-primary/20 shadow-xs"
                              : "bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-container-high"
                          }`}
                          title={t("archive.viewVersions")}
                        >
                          <span className="material-symbols-outlined text-[12px]">history</span>
                          <span>v{artifact.version_count || 1}</span>
                        </button>
                        {isYaml && (
                          <span className="bg-primary/10 text-primary border border-primary/30 px-1.5 py-0.5 text-[10px] font-hankenGrotesk uppercase tracking-wider font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">data_object</span>
                            {t("archive.yamlManifestBadge")}
                          </span>
                        )}
                        {artifact.bucket === "curated-master" && (
                          <span className="bg-primary/10 text-primary border border-primary/30 px-1.5 py-0.5 text-[10px] font-hankenGrotesk uppercase tracking-wider font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            {t("archive.curatedMasterBadge")}
                          </span>
                        )}
                        {(artifact.bucket === "raw-primary" || artifact.bucket.includes("raw")) && (
                          <span className="bg-surface-container text-on-surface-variant border border-outline-variant px-1.5 py-0.5 text-[10px] font-hankenGrotesk uppercase tracking-wider font-semibold">
                            {t("archive.rawPrimaryBadge")}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="font-ebGaramond text-headline-sm text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors truncate" title={artifact.key}>
                      {artifact.key}
                    </h3>
                    <p className="font-hankenGrotesk text-body-sm text-on-surface-variant mb-4 text-xs">
                      Bucket: <code className="bg-surface-container px-1">{artifact.bucket}</code>
                    </p>
                    <div className="flex flex-col gap-2 border-t border-outline-variant/40 pt-3 mt-auto">
                      <div className="flex justify-between items-center">
                        <span className="font-hankenGrotesk text-data-mono text-outline text-[10px]">Size</span>
                        <span className="font-hankenGrotesk text-data-mono text-on-surface text-[10px]">{formatSize(artifact.size)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-hankenGrotesk text-data-mono text-outline text-[10px]">Modified</span>
                        <span className="font-hankenGrotesk text-data-mono text-on-surface text-[10px]">{new Date(artifact.last_modified).toLocaleDateString(i18n.language)}</span>
                      </div>
                      {(canEdit || isAdmin) && (
                        <div className="flex justify-between items-center pt-2 mt-1 border-t border-outline-variant/20">
                          <span className="font-hankenGrotesk text-[10px] text-outline uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-primary">
                              {isAdmin ? "admin_panel_settings" : "verified_user"}
                            </span>
                            {isAdmin ? "Admin" : "Curator"}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setArtifactForVersions(artifact);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-hankenGrotesk uppercase tracking-wider text-outline hover:text-primary hover:bg-surface-container border border-outline-variant transition-colors cursor-pointer"
                              title={t("archive.viewVersions")}
                            >
                              <span className="material-symbols-outlined text-[13px]">history</span>
                              {t("archive.versions")}
                            </button>
                            {canEdit && isYaml && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setArtifactToEditYaml(artifact);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-hankenGrotesk uppercase tracking-wider text-primary hover:bg-primary/10 border border-primary/40 transition-colors font-semibold cursor-pointer shadow-sm"
                                title={t("archive.editYaml")}
                              >
                                <span className="material-symbols-outlined text-[14px]">edit_note</span>
                                {t("archive.editYaml")}
                              </button>
                            )}
                            {canEdit && !isYaml && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenEdit(artifact);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-hankenGrotesk uppercase tracking-wider text-primary hover:bg-primary/10 border border-primary/30 transition-colors font-medium cursor-pointer"
                                title={t("archive.edit")}
                              >
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                {t("archive.edit")}
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setArtifactToDelete(artifact);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-hankenGrotesk uppercase tracking-wider text-error hover:bg-error-container hover:text-on-error-container border border-error/30 transition-colors font-medium cursor-pointer"
                                title={t("archive.delete")}
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                {t("archive.delete")}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
              })}
            </div>
          )}
          
          {!isLoading && groupedArtifacts.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-display-lg text-outline-variant mb-4">search_off</span>
              <p className="font-ebGaramond text-headline-md text-on-surface-variant">
                {t("archive.noResults")}
              </p>
              <p className="font-hankenGrotesk text-body-md text-outline mt-2">
                {t("archive.noResultsDesc")}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Admin Delete Confirmation Modal */}
      {artifactToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-error-container text-on-error flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl text-error">warning</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-ebGaramond text-headline-sm text-primary mb-2">
                  {t("archive.deleteConfirmTitle")}
                </h3>
                <p className="font-hankenGrotesk text-body-sm text-on-surface-variant mb-4">
                  {t("archive.deleteConfirmDesc", {
                    key: artifactToDelete.key,
                    bucket: artifactToDelete.bucket
                  })}
                </p>
                <div className="bg-surface-container-low p-3 border border-outline-variant mb-4 text-xs font-data-mono space-y-1 overflow-x-auto">
                  <div><strong className="text-outline">Bucket:</strong> {artifactToDelete.bucket}</div>
                  <div><strong className="text-outline">Key:</strong> {artifactToDelete.key}</div>
                  <div><strong className="text-outline">Zonen:</strong> {artifactToDelete.zones.join(", ")}</div>
                </div>

                {deleteError && (
                  <div className="p-3 mb-4 bg-error-container text-on-error-container text-xs font-hankenGrotesk border border-error/40">
                    {deleteError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setArtifactToDelete(null); setDeleteError(null); }}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-outline text-on-surface hover:bg-surface-container font-hankenGrotesk text-label-md uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {t("archive.deleteCancelButton")}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-error text-on-error font-hankenGrotesk text-label-md uppercase tracking-wider hover:bg-error/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-on-error border-t-transparent"></div>
                        <span>{t("archive.deleting")}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                        <span>{t("archive.deleteConfirmButton")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Rename Modal */}
      {artifactToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">edit_document</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-ebGaramond text-headline-sm text-primary mb-1">
                  {t("archive.editModalTitle")}
                </h3>
                <p className="font-hankenGrotesk text-body-sm text-on-surface-variant mb-4">
                  {t("archive.editModalDesc")}
                </p>

                <form onSubmit={handleConfirmEdit} className="space-y-4">
                  <div className="bg-surface-container-low p-2.5 border border-outline-variant text-xs font-data-mono flex items-center justify-between">
                    <span className="text-outline">Bucket:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface font-bold">{artifactToEdit.bucket}</span>
                      {promoteToMaster && (
                        <>
                          <span className="material-symbols-outlined text-[14px] text-primary">arrow_forward</span>
                          <span className="text-primary font-bold">curated-master</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Option to open in YAML editor if YAML */}
                  {(artifactToEdit.is_yaml || artifactToEdit.key.toLowerCase().endsWith(".yml") || artifactToEdit.key.toLowerCase().endsWith(".yaml") || artifactToEdit.bucket === "metadata-manifests") && (
                    <div className="p-3 bg-primary/10 border border-primary/30 flex items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">edit_note</span>
                        <span className="font-hankenGrotesk text-xs text-on-surface">
                          {t("archive.yamlNotice")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const art = artifactToEdit;
                          setArtifactToEdit(null);
                          setArtifactToEditYaml(art);
                        }}
                        className="px-2.5 py-1 bg-primary text-on-primary text-[11px] font-hankenGrotesk uppercase tracking-wider font-semibold whitespace-nowrap hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[13px]">code</span>
                        {t("archive.openInYamlEditor")}
                      </button>
                    </div>
                  )}

                  {/* Option to promote raw data to curated_master */}
                  {(artifactToEdit.bucket === "raw-primary" || artifactToEdit.bucket.includes("raw")) && (
                    <div className={`p-3.5 border transition-all ${promoteToMaster ? 'bg-primary/10 border-primary shadow-sm' : 'bg-surface-container-low border-outline-variant'}`}>
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={promoteToMaster}
                          onChange={(e) => setPromoteToMaster(e.target.checked)}
                          className="mt-0.5 h-4 w-4 text-primary focus:ring-primary border-outline cursor-pointer accent-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-[17px]">verified</span>
                            <span className="font-hankenGrotesk text-xs uppercase tracking-wider text-primary font-bold">
                              {t("archive.promoteToMasterTitle")}
                            </span>
                          </div>
                          <p className="font-hankenGrotesk text-xs text-on-surface-variant mt-1 leading-relaxed">
                            {t("archive.promoteToMasterDesc")}
                          </p>
                          {promoteToMaster && (
                            <div className="mt-2.5 pt-2 border-t border-primary/20 flex flex-wrap gap-x-4 gap-y-1 font-data-mono text-[11px] text-primary">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">history</span>
                                100 Jahre Retention (Object Lock)
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">sync</span>
                                Multisite Replikation (Zone A &amp; B)
                              </span>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  )}

                  <div>
                    <label className="block font-hankenGrotesk text-xs uppercase tracking-wider text-on-surface mb-1 font-medium">
                      {t("archive.fileName")} *
                    </label>
                    <input
                      type="text"
                      value={editNewKey}
                      onChange={(e) => setEditNewKey(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-surface border border-outline focus:border-primary focus:ring-0 font-hankenGrotesk text-body-md text-on-surface rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block font-hankenGrotesk text-xs uppercase tracking-wider text-on-surface mb-1 font-medium">
                      {t("archive.accessionIdLabel")}
                    </label>
                    <input
                      type="text"
                      value={editAccessionId}
                      onChange={(e) => setEditAccessionId(e.target.value)}
                      placeholder="z. B. ACC-2026-001"
                      className="w-full px-3 py-2 bg-surface border border-outline focus:border-primary focus:ring-0 font-hankenGrotesk text-body-md text-on-surface rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block font-hankenGrotesk text-xs uppercase tracking-wider text-on-surface mb-1 font-medium">
                      {t("archive.replaceFile")}
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                      className="w-full text-xs font-hankenGrotesk text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:border file:border-outline file:bg-surface-container file:text-xs file:font-hankenGrotesk hover:file:bg-surface-container-high cursor-pointer"
                    />
                  </div>

                  {editError && (
                    <div className="p-3 bg-error-container text-on-error-container text-xs font-hankenGrotesk border border-error/40">
                      {editError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/30">
                    <button
                      type="button"
                      onClick={() => { setArtifactToEdit(null); setEditError(null); }}
                      disabled={isEditing}
                      className="px-4 py-2 border border-outline text-on-surface hover:bg-surface-container font-hankenGrotesk text-label-md uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {t("archive.deleteCancelButton")}
                    </button>
                    <button
                      type="submit"
                      disabled={isEditing}
                      className="px-4 py-2 bg-primary text-on-primary font-hankenGrotesk text-label-md uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isEditing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-on-primary border-t-transparent"></div>
                          <span>{t("archive.saving")}</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">save</span>
                          <span>{t("archive.saveChanges")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated YAML Editor Modal */}
      {artifactToEditYaml && (
        <YamlEditorModal
          artifact={artifactToEditYaml}
          onClose={() => setArtifactToEditYaml(null)}
          onSaved={async (msg) => {
            setArtifactToEditYaml(null);
            await queryClient.invalidateQueries({ queryKey: ["artifactSearch"] });
            await queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
            setEditSuccess(msg || t("archive.yamlSuccess"));
            setTimeout(() => setEditSuccess(null), 5000);
          }}
        />
      )}

      {/* Version History Modal */}
      {artifactForVersions && (
        <VersionHistoryModal
          artifact={artifactForVersions}
          onClose={() => setArtifactForVersions(null)}
          onRollbackSuccess={async (msg) => {
            await queryClient.invalidateQueries({ queryKey: ["artifactSearch"] });
            await queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
            setEditSuccess(msg);
            setTimeout(() => setEditSuccess(null), 5000);
          }}
          onOpenInEditor={(art) => {
            setArtifactToEditYaml(art);
          }}
        />
      )}
    </div>
  );
}
