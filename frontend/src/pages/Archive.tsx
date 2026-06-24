import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useArtifactSearch, Artifact } from "../hooks/useArtifactSearch";

export function Archive() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  
  const { data: artifacts, isLoading, isError } = useArtifactSearch(activeQuery);

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
          <h2 className="font-ebGaramond text-display-lg text-primary mb-6 text-center">Search the Archives</h2>
          <form onSubmit={handleSearch} className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-4 text-outline z-10">search</span>
            <input 
              type="text" 
              placeholder="Search manuscripts, artifacts, or eras..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-16 py-4 bg-transparent border-0 border-b-2 border-outline focus:border-primary focus:ring-0 font-hankenGrotesk text-body-lg text-on-surface placeholder:text-outline-variant transition-colors rounded-none"
            />
            <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-primary font-hankenGrotesk text-label-md uppercase hover:bg-surface-container p-2 transition-colors">
              Search
            </button>
          </form>
          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            <span className="font-hankenGrotesk text-data-mono text-outline uppercase flex items-center mt-1">Suggested:</span>
            <button onClick={() => { setSearchQuery("raw"); setActiveQuery("raw"); }} className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-container px-3 py-1 hover:bg-outline-variant hover:text-on-primary transition-colors">Raw Data</button>
            <span className="text-outline-variant text-[10px] mt-1">◆</span>
            <button onClick={() => { setSearchQuery("manifest"); setActiveQuery("manifest"); }} className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-container px-3 py-1 hover:bg-outline-variant hover:text-on-primary transition-colors">Manifests</button>
            <span className="text-outline-variant text-[10px] mt-1">◆</span>
            <button onClick={() => { setSearchQuery(".png"); setActiveQuery(".png"); }} className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-container px-3 py-1 hover:bg-outline-variant hover:text-on-primary transition-colors">Images</button>
          </div>
        </div>
      </section>

      {/* Main Layout: Sidebar + Grid */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-container-max mx-auto">
        {/* Filter Sidebar (Simplified for now) */}
        <aside className="w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-outline-variant p-margin-mobile md:p-8 bg-surface-container-lowest">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-hankenGrotesk text-label-md uppercase text-on-surface tracking-wider">Refine Results</h3>
            <button onClick={() => { setSearchQuery(""); setActiveQuery(""); }} className="text-outline hover:text-primary transition-colors font-hankenGrotesk text-data-mono">Clear All</button>
          </div>

          <div className="mb-8">
            <h4 className="font-ebGaramond text-headline-md text-primary mb-4 border-b border-outline-variant/50 pb-2">Status</h4>
            <div className="p-4 bg-surface-container-low border border-outline-variant text-sm font-hankenGrotesk text-on-surface-variant">
              {isLoading ? "Searching S3 zones..." : isError ? "Error fetching results" : `Found ${groupedArtifacts.length} unique items`}
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <section className="flex-1 p-margin-mobile md:p-8 bg-background">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <p className="font-hankenGrotesk text-body-md text-on-surface-variant">
              {activeQuery ? (
                <>Showing <strong className="text-on-surface font-semibold">{groupedArtifacts.length}</strong> artifacts for "{activeQuery}"</>
              ) : (
                <>Browse all <strong className="text-on-surface font-semibold">{groupedArtifacts.length}</strong> artifacts</>
              )}
            </p>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedArtifacts.map((artifact, index) => (
                <article key={index} className="archival-card group bg-surface-container-lowest border border-outline-variant flex flex-col relative overflow-hidden h-[450px]">
                  <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
                    {artifact.zones.map(zone => (
                      <span key={zone} className="bg-surface-container-lowest/80 backdrop-blur-sm text-outline px-2 py-1 border border-outline-variant text-[10px] font-hankenGrotesk uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">location_on</span> {zone}
                      </span>
                    ))}
                    {artifact.zones.length > 1 && (
                      <span className="bg-primary/10 text-primary px-2 py-1 border border-primary/20 text-[9px] font-hankenGrotesk uppercase tracking-tighter">
                        Replicated
                      </span>
                    )}
                  </div>
                  <div className="h-48 w-full relative border-b border-outline-variant/50 p-2 bg-surface-container-low flex items-center justify-center overflow-hidden">
                    {artifact.preview_url ? (
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
                    <span className={`fallback-icon material-symbols-outlined text-display-lg text-outline-variant/30 ${artifact.preview_url ? 'hidden' : ''}`}>
                      description
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="mb-2">
                      <span className="font-hankenGrotesk text-[10px] uppercase tracking-widest text-outline">Accession ID</span>
                      <p className="font-data-mono text-xs text-primary font-bold">{artifact.accession_id}</p>
                    </div>
                    <h3 className="font-ebGaramond text-headline-sm text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors truncate" title={artifact.key}>
                      {artifact.key}
                    </h3>
                    <p className="font-hankenGrotesk text-body-sm text-on-surface-variant mb-4 flex-1 text-xs">
                      Bucket: <code className="bg-surface-container px-1">{artifact.bucket}</code>
                    </p>
                    <div className="flex flex-col gap-1 border-t border-outline-variant/40 pt-3 mt-auto">
                      <div className="flex justify-between items-center"><span className="font-hankenGrotesk text-data-mono text-outline text-[10px]">Size</span><span className="font-hankenGrotesk text-data-mono text-on-surface text-[10px]">{formatSize(artifact.size)}</span></div>
                      <div className="flex justify-between items-center"><span className="font-hankenGrotesk text-data-mono text-outline text-[10px]">Modified</span><span className="font-hankenGrotesk text-data-mono text-on-surface text-[10px]">{new Date(artifact.last_modified).toLocaleDateString()}</span></div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          
          {!isLoading && groupedArtifacts.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-display-lg text-outline-variant mb-4">search_off</span>
              <p className="font-ebGaramond text-headline-md text-on-surface-variant">No artifacts found matching your search.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
