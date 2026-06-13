import { Link } from "react-router-dom";
import { useDashboardStats } from "../hooks/useDashboardStats";

export function Dashboard() {
  const { data: stats, isLoading, isError } = useDashboardStats();

  return (
    <div className="flex-1 overflow-y-auto pt-8 px-margin-mobile md:px-margin-desktop pb-section-gap">
      <div className="max-w-container-max mx-auto space-y-section-gap">
        <section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Widget 1 */}
            <div className="bg-surface-container-low border border-outline-variant p-6 ambient-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">museum</span>
                <span className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-variant px-2 py-1">TOTAL</span>
              </div>
              <h3 className="font-ebGaramond text-headline-lg text-on-surface">
                {isLoading ? "..." : (stats?.totalArtifacts.toLocaleString() || "14,208")}
              </h3>
              <p className="font-hankenGrotesk text-label-md text-on-surface-variant mt-1">Cataloged Artifacts</p>
            </div>

            {/* Widget 2 */}
            <div className="bg-surface-container-low border border-outline-variant p-6 ambient-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-secondary text-3xl">database</span>
                <span className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-variant px-2 py-1">USAGE</span>
              </div>
              <h3 className="font-ebGaramond text-headline-lg text-on-surface">
                {isLoading ? "..." : (stats?.totalUploadsSize || "4.2 TB")}
              </h3>
              <p className="font-hankenGrotesk text-label-md text-on-surface-variant mt-1">Digital Preservation Storage</p>
            </div>

            {/* Widget 3 */}
            <div className="bg-surface-container-low border border-outline-variant p-6 ambient-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-tertiary text-3xl">groups</span>
                <span className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-variant px-2 py-1">ACTIVE</span>
              </div>
              <h3 className="font-ebGaramond text-headline-lg text-on-surface">
                {isLoading ? "..." : (stats?.activeCurators || 12)}
              </h3>
              <p className="font-hankenGrotesk text-label-md text-on-surface-variant mt-1">Curators Online</p>
            </div>



            {/* Widget: Hero Map */}
            <div className="md:col-span-3 bg-surface-container-lowest border border-outline-variant p-6 ambient-shadow">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">public</span>
                  <h3 className="font-ebGaramond text-headline-md text-on-surface">Storage Locations</h3>
                </div>
                <span className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-variant px-2 py-1">NODE TOPOLOGY</span>
              </div>
              <div className="mb-4 overflow-hidden rounded border border-outline-variant">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLuYUHLozzzxVryc57Q09N1in1Xc3N7zMFdPZEkwBnnJMRM12CyrFXSbjBdtiaJvThsuXuSVC_BY_U4twkIhjjc72tNDEmlakfiqhiEUP-E1dnkZfK_-IoIC5WAECMSRAzh_hzBpm6u6Smdg4S3r6Sg-Uv6iXQCZ1dxDhVt6V0MSxvvGfSfeA2-ghTqL9PcyZMtQB9q-iwmUI4_uu23dn6Tda9ylRKdY3cJM-C7FcWeDh1zF1izZtjGAIeBiE22qLDzPVKQZlVPVw"
                  alt="Map of global archival data nodes"
                  className="w-full h-[400px] md:h-[600px] object-cover"
                />
              </div>
              <p className="font-hankenGrotesk text-label-md text-on-surface-variant">
                Active Sync Across: {isLoading ? "..." : (stats?.storageLocations.join(", ") || "Cairo, Alexandria, Baghdad, Basra")}
              </p>
            </div>


          </div>
        </section>

        <div className="pattern-divider">
          <span className="material-symbols-outlined text-sm">change_history</span>
        </div>

        {/* Recent Accessions & Health */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Recent Accessions List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-end border-b border-outline-variant pb-2">
              <h3 className="font-ebGaramond text-headline-md text-on-surface">Recent Accessions</h3>
              <Link to="/archive" className="font-hankenGrotesk text-label-md text-primary hover:underline">View Ledger</Link>
            </div>

            <div className="space-y-4">
              {/* Item 1 */}
              <div className="flex items-center gap-6 p-4 bg-surface-container-lowest border border-surface-variant hover:bg-surface-container-low transition-colors group cursor-pointer">
                <div className="w-16 h-16 shrink-0 border border-outline-variant p-1 bg-surface-bright">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDK0hLR-MDmbDBZnXdlOe-HGVau-yMJJbyS-oC-4lYm3DpfsBqMYTkwl7UWSRRGDZI9dCpjs0OOfzqDxeMG6jemSFSCjQJal-f4irUa1tQ4xICw8U5Xyca8GLJnNCBWsGlApmG3w4q7fgLD74gjaanzScVhXcLd9x02QvDNe4F-uB4-5RL6_38OAso9ahJQzxmIe9PkhbCB6Cg7eAT_RWRwgwAvHIzRlVGMBSqqHF8Uk_yDL8uuG4vseEOlM9985q76XP-4Kq5gpT8"
                    alt="Ancient Pottery Fragment"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-ebGaramond text-body-lg font-medium text-on-surface group-hover:text-primary transition-colors">Berber Terracotta Vessel Fragment</h4>
                  <div className="flex gap-4 mt-1 font-hankenGrotesk text-data-mono text-on-surface-variant flex-wrap">
                    <span>ACC-2023-089</span><span>•</span>
                    <span>High Atlas</span><span>•</span>
                    <span>c. 12th Century</span><span>•</span>
                    <span className="font-semibold">Speicherorte:</span><span>Primary Vault, Cloud Mirror</span>
                  </div>
                </div>
                <Link to="/artifact/ACC-2023-089" className="text-outline-variant hover:text-primary p-2">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-6 p-4 bg-surface-container-lowest border border-surface-variant hover:bg-surface-container-low transition-colors group cursor-pointer">
                <div className="w-16 h-16 shrink-0 border border-outline-variant p-1 bg-surface-bright flex items-center justify-center">
                  <span className="material-symbols-outlined text-outline-variant text-3xl">menu_book</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-ebGaramond text-body-lg font-medium text-on-surface group-hover:text-primary transition-colors">Illuminated Manuscript Folio</h4>
                  <div className="flex gap-4 mt-1 font-hankenGrotesk text-data-mono text-on-surface-variant flex-wrap">
                    <span>MSS-2023-112</span><span>•</span>
                    <span>Fez</span><span>•</span>
                    <span>Digitization Pending</span><span>•</span>
                    <span className="font-semibold">Speicherorte:</span><span>Primary Vault</span>
                  </div>
                </div>
                <Link to="/artifact/MSS-2023-112" className="text-outline-variant hover:text-primary p-2">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>

          {/* System Health Widget */}
          <div className="space-y-6">
            <div className="border-b border-outline-variant pb-2">
              <h3 className="font-ebGaramond text-headline-md text-on-surface">Preservation Status</h3>
            </div>
            <div className="bg-secondary-container border border-outline-variant p-6 h-[calc(100%-3rem)] flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-hankenGrotesk text-label-md text-on-secondary-container">All Systems Optimal</span>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <div className="flex justify-between font-hankenGrotesk text-data-mono text-on-secondary-container mb-1">
                    <span>Primary Storage</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-surface-variant h-1">
                    <div className="bg-secondary h-1 w-[85%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-hankenGrotesk text-data-mono text-on-secondary-container mb-1">
                    <span>Cloud Backup</span>
                    <span>Syncing (99%)</span>
                  </div>
                  <div className="w-full bg-surface-variant h-1">
                    <div className="bg-secondary h-1 w-[99%]"></div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-outline/20">
                <button className="w-full border border-secondary text-secondary font-hankenGrotesk text-label-md py-2 px-4 hover:bg-secondary hover:text-on-secondary transition-colors uppercase">
                  Run Diagnostic
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
