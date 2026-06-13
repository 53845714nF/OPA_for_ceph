import { Link } from "react-router-dom";

export function ArtifactDetail() {
  return (
    <div className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      {/* Task-Focused Header (Suppressed main nav for detail view) */}
      <header className="mb-8 flex justify-between items-center">
        <Link to="/archive" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group cursor-pointer">
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="font-label-md text-label-md uppercase tracking-widest">Return to Archive</span>
        </Link>
        <div className="flex items-center gap-4">
          <button aria-label="Print Document" className="w-10 h-10 flex items-center justify-center border border-outline text-on-surface hover:bg-surface-container-high transition-colors rounded-none">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>print</span>
          </button>
          <button aria-label="Bookmark" className="w-10 h-10 flex items-center justify-center border border-outline text-on-surface hover:bg-surface-container-high transition-colors rounded-none">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>bookmark_border</span>
          </button>
          <button className="px-6 py-2 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-widest hover:bg-primary/90 transition-colors rounded-none shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Request Access
          </button>
        </div>
      </header>

      {/* Artifact Header */}
      <div className="mb-12 max-w-3xl">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Manuscript</span>
          <span className="text-outline-variant text-[10px]">◆</span>
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">11th Century</span>
          <span className="text-outline-variant text-[10px]">◆</span>
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Science &amp; Optics</span>
        </div>
        <h1 className="font-display-lg text-display-lg text-primary mb-4 leading-tight">Kitab al-Manazir (Book of Optics) - Fragmented Folio</h1>
        <div className="flex items-center gap-6 font-data-mono text-data-mono text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
            Accession ID: NA-1044-B
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            Curatorial Verification: Validated
          </div>
        </div>
      </div>

      {/* 12-Column Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-section-gap">
        {/* Left: High-Res Image Viewer (8 cols) */}
        <div className="md:col-span-8 flex flex-col">
          <div className="p-4 bg-surface-container-low border border-outline-variant rounded-none relative group">
            <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <button aria-label="Zoom In" className="w-10 h-10 bg-surface/90 border border-outline text-on-surface flex items-center justify-center hover:bg-surface transition-colors rounded-none backdrop-blur-sm">
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button aria-label="Zoom Out" className="w-10 h-10 bg-surface/90 border border-outline text-on-surface flex items-center justify-center hover:bg-surface transition-colors rounded-none backdrop-blur-sm">
                <span className="material-symbols-outlined">zoom_out</span>
              </button>
              <button aria-label="Fullscreen" className="w-10 h-10 bg-surface/90 border border-outline text-on-surface flex items-center justify-center hover:bg-surface transition-colors rounded-none backdrop-blur-sm">
                <span className="material-symbols-outlined">fullscreen</span>
              </button>
            </div>
            
            <div className="border border-outline bg-surface-bright relative overflow-hidden flex items-center justify-center min-h-[600px] cursor-crosshair">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbrQOaBbDczNQSpSy1bOsuhggnBD41VSbN06OJUxHh4t-4Cq-TJ1c338JJxVN6Puwwfv32gg5ziVlTGlNgj4bEAJGl4mszk1wywSpnZwK6DSRR-QREVywddiq4VejdmrFlC1vGMtCeti-gLGEWlUCFY9NUTMrrRaRGtC_G_ST3pn5MGbYQ-HeqHk9xQxS67c3YjUxHNp8msPrR2Go8OSmtgSKVDntQaKCtWAwHt5ET9g4zNsj2pRUegDVK9LDE1vPVNduqAthl7q8" 
                alt="Manuscript Folio" 
                className="w-full h-full object-contain max-h-[800px] transition-transform duration-700 hover:scale-110 object-center" 
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 text-on-surface-variant border-t border-outline-variant pt-3">
            <span className="font-data-mono text-data-mono">Scan Res: 1200 DPI | Color Profile: Adobe RGB (1998)</span>
            <span className="font-data-mono text-data-mono">Scale: 1:1 Reference</span>
          </div>
        </div>

        {/* Right: Metadata Ledger (4 cols) */}
        <div className="md:col-span-4 bg-surface border border-outline-variant rounded-none p-8 h-fit self-start sticky top-32">
          <h2 className="font-headline-md text-headline-md text-primary mb-8 border-b-2 border-primary pb-4 inline-block">Curatorial Record</h2>
          <div className="flex flex-col">
            <div className="py-4 border-b border-outline-variant flex flex-col gap-1 group hover:bg-surface-container-low transition-colors px-2 -mx-2">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Original Author</span>
              <span className="font-body-md text-body-md text-on-surface">Ibn al-Haytham (Alhazen)</span>
            </div>
            <div className="py-4 border-b border-outline-variant flex flex-col gap-1 group hover:bg-surface-container-low transition-colors px-2 -mx-2">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Date of Origin</span>
              <span className="font-body-md text-body-md text-on-surface">Circa 1011–1021 CE</span>
            </div>
            <div className="py-4 border-b border-outline-variant flex flex-col gap-1 group hover:bg-surface-container-low transition-colors px-2 -mx-2">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Geographic Origin</span>
              <span className="font-body-md text-body-md text-on-surface">Cairo, Fatimid Caliphate</span>
            </div>
            <div className="py-4 border-b border-outline-variant flex flex-col gap-1 group hover:bg-surface-container-low transition-colors px-2 -mx-2">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Material Medium</span>
              <span className="font-body-md text-body-md text-on-surface">Iron gall ink on vellum</span>
            </div>
            <div className="py-4 border-b border-outline-variant flex flex-col gap-1 group hover:bg-surface-container-low transition-colors px-2 -mx-2">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Physical Dimensions</span>
              <span className="font-data-mono text-data-mono text-on-surface">H: 31.5 cm x W: 22.0 cm</span>
            </div>
            <div className="py-4 border-b border-outline-variant flex flex-col gap-1 group hover:bg-surface-container-low transition-colors px-2 -mx-2">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Acquisition Source</span>
              <span className="font-body-md text-body-md text-on-surface">The Al-Fassi Family Trust (1984)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center my-16 opacity-60">
        <div className="flex-grow border-t border-outline-variant"></div>
        <span className="mx-6 text-outline font-display-lg leading-none">✦</span>
        <div className="flex-grow border-t border-outline-variant"></div>
      </div>

      {/* File Browser Section */}
      <section className="max-w-5xl mx-auto">
        <h3 className="font-headline-lg text-headline-lg text-primary mb-2 text-center">Associated Digital Assets</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-12 text-center max-w-2xl mx-auto">
          Comprehensive access to digitized surrogates, structural metadata, and restricted provenance documentation. Access rights apply.
        </p>
        
        <div className="bg-surface border border-outline-variant rounded-none flex flex-col">
          {/* Category: Rohdaten */}
          <div className="border-b border-outline-variant last:border-b-0">
            <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-b border-outline-variant">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">folder_open</span>
                <h4 className="font-label-md text-label-md uppercase tracking-widest text-on-surface">Rohdaten (Raw Data)</h4>
              </div>
              <span className="font-data-mono text-data-mono text-on-surface-variant">2 Items</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-lowest transition-colors border-b border-outline-variant/50 last:border-b-0">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-on-surface-variant font-light text-[20px]">image</span>
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-on-surface">NA-1044-B_Recto_Master.tiff</span>
                    <span className="font-data-mono text-data-mono text-on-surface-variant">1.2 GB · Uncompressed 16-bit</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-data-mono text-data-mono text-on-secondary-container bg-secondary-container px-2 py-0.5 border border-outline-variant/30 uppercase tracking-wider text-[11px]">[ PUBLIC ]</span>
                  <button aria-label="Download" className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">download</span></button>
                </div>
              </div>
              <div className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-lowest transition-colors border-b border-outline-variant/50 last:border-b-0">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-on-surface-variant font-light text-[20px]">image</span>
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-on-surface">NA-1044-B_Verso_Master.tiff</span>
                    <span className="font-data-mono text-data-mono text-on-surface-variant">1.1 GB · Uncompressed 16-bit</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-data-mono text-data-mono text-on-secondary-container bg-secondary-container px-2 py-0.5 border border-outline-variant/30 uppercase tracking-wider text-[11px]">[ PUBLIC ]</span>
                  <button aria-label="Download" className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">download</span></button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Category: Metadaten */}
          <div className="border-b border-outline-variant last:border-b-0">
            <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-b border-outline-variant">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">data_object</span>
                <h4 className="font-label-md text-label-md uppercase tracking-widest text-on-surface">Metadaten (Metadata)</h4>
              </div>
              <span className="font-data-mono text-data-mono text-on-surface-variant">2 Items</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-lowest transition-colors border-b border-outline-variant/50 last:border-b-0">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-on-surface-variant font-light text-[20px]">code</span>
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-on-surface">NA-1044-B_TEI_Encoding.xml</span>
                    <span className="font-data-mono text-data-mono text-on-surface-variant">45 KB · Text Encoding Initiative P5</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-data-mono text-data-mono text-on-secondary-container bg-secondary-container px-2 py-0.5 border border-outline-variant/30 uppercase tracking-wider text-[11px]">[ PUBLIC ]</span>
                  <button aria-label="Download" className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">download</span></button>
                </div>
              </div>
              <div className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-lowest transition-colors border-b border-outline-variant/50 last:border-b-0">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-on-surface-variant font-light text-[20px]">description</span>
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-on-surface">NA-1044-B_MARC21_Record.mrc</span>
                    <span className="font-data-mono text-data-mono text-on-surface-variant">12 KB · Machine-Readable Cataloging</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-data-mono text-data-mono text-on-secondary-container bg-secondary-container px-2 py-0.5 border border-outline-variant/30 uppercase tracking-wider text-[11px]">[ PUBLIC ]</span>
                  <button aria-label="Download" className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">download</span></button>
                </div>
              </div>
            </div>
          </div>

          {/* Category: Sensible Daten */}
          <div className="border-b border-outline-variant last:border-b-0">
            <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-b border-outline-variant">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error">lock</span>
                <h4 className="font-label-md text-label-md uppercase tracking-widest text-on-surface">Sensible Daten (Sensitive Data)</h4>
              </div>
              <span className="font-data-mono text-data-mono text-on-surface-variant">1 Item</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-lowest transition-colors border-b border-outline-variant/50 last:border-b-0 opacity-75">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-on-surface-variant font-light text-[20px]">receipt_long</span>
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-on-surface">NA-1044-B_Provenance_Valuation.pdf</span>
                    <span className="font-data-mono text-data-mono text-on-surface-variant">1.5 MB · Restricted Access</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-data-mono text-data-mono text-on-error bg-error-container px-2 py-0.5 border border-error/30 uppercase tracking-wider text-[11px]">[ RESTRICTED ]</span>
                  <button aria-label="Locked" className="text-outline cursor-not-allowed" disabled><span className="material-symbols-outlined text-[20px]">lock</span></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Space */}
      <footer className="mt-16 py-8 border-t border-outline-variant text-center">
        <p className="font-data-mono text-data-mono text-on-surface-variant">HERITAGE ARCHIVE © 2024. ALL ARTIFACTS SUBJECT TO INSTITUTIONAL COPYRIGHT.</p>
      </footer>
    </div>
  );
}
