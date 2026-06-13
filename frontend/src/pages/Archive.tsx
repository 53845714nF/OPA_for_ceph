import { Link } from "react-router-dom";

export function Archive() {
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Search Hero Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-12 border-b border-outline-variant bg-surface-container-lowest">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-ebGaramond text-display-lg text-primary mb-6 text-center">Search the Archives</h2>
          <div className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-4 text-outline z-10">search</span>
            <input 
              type="text" 
              placeholder="Search manuscripts, artifacts, or eras..." 
              className="w-full pl-12 pr-16 py-4 bg-transparent border-0 border-b-2 border-outline focus:border-primary focus:ring-0 font-hankenGrotesk text-body-lg text-on-surface placeholder:text-outline-variant transition-colors rounded-none"
            />
            <button className="absolute right-0 top-1/2 -translate-y-1/2 text-primary font-hankenGrotesk text-label-md uppercase hover:bg-surface-container p-2 transition-colors">
              Search
            </button>
          </div>
          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            <span className="font-hankenGrotesk text-data-mono text-outline uppercase flex items-center mt-1">Suggested:</span>
            <button className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-container px-3 py-1 hover:bg-outline-variant hover:text-on-primary transition-colors">Almohad Dynasty</button>
            <span className="text-outline-variant text-[10px] mt-1">◆</span>
            <button className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-container px-3 py-1 hover:bg-outline-variant hover:text-on-primary transition-colors">Islamic Calligraphy</button>
            <span className="text-outline-variant text-[10px] mt-1">◆</span>
            <button className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-container px-3 py-1 hover:bg-outline-variant hover:text-on-primary transition-colors">Fez Pottery</button>
          </div>
        </div>
      </section>

      {/* Main Layout: Sidebar + Grid */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-container-max mx-auto">
        {/* Filter Sidebar */}
        <aside className="w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-outline-variant p-margin-mobile md:p-8 bg-surface-container-lowest">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-hankenGrotesk text-label-md uppercase text-on-surface tracking-wider">Refine Results</h3>
            <button className="text-outline hover:text-primary transition-colors font-hankenGrotesk text-data-mono">Clear All</button>
          </div>

          {/* Filter Group: Period */}
          <div className="mb-8">
            <h4 className="font-ebGaramond text-headline-md text-primary mb-4 border-b border-outline-variant/50 pb-2">Period</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 text-primary border-outline rounded-none focus:ring-primary focus:ring-opacity-50 focus:ring-offset-0 bg-transparent" />
                <span className="font-hankenGrotesk text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">Almoravid (1040–1147)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-primary border-outline rounded-none focus:ring-primary focus:ring-opacity-50 focus:ring-offset-0 bg-transparent" />
                <span className="font-hankenGrotesk text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">Almohad (1121–1269)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-primary border-outline rounded-none focus:ring-primary focus:ring-opacity-50 focus:ring-offset-0 bg-transparent" />
                <span className="font-hankenGrotesk text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">Marinid (1244–1465)</span>
              </label>
            </div>
          </div>

          {/* Filter Group: Material */}
          <div className="mb-8">
            <h4 className="font-ebGaramond text-headline-md text-primary mb-4 border-b border-outline-variant/50 pb-2">Material</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 text-primary border-outline rounded-none focus:ring-primary focus:ring-opacity-50 focus:ring-offset-0 bg-transparent" />
                <span className="font-hankenGrotesk text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">Parchment</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-primary border-outline rounded-none focus:ring-primary focus:ring-opacity-50 focus:ring-offset-0 bg-transparent" />
                <span className="font-hankenGrotesk text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">Ceramic</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-primary border-outline rounded-none focus:ring-primary focus:ring-opacity-50 focus:ring-offset-0 bg-transparent" />
                <span className="font-hankenGrotesk text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">Bronze</span>
              </label>
            </div>
          </div>

          {/* Filter Group: Region */}
          <div className="mb-8">
            <h4 className="font-ebGaramond text-headline-md text-primary mb-4 border-b border-outline-variant/50 pb-2">Region</h4>
            <select className="w-full bg-transparent border-0 border-b border-outline text-on-surface font-hankenGrotesk text-body-md py-2 px-0 focus:ring-0 focus:border-primary rounded-none cursor-pointer">
              <option value="all">All Regions</option>
              <option value="maghreb">Maghreb</option>
              <option value="andalusia">Andalusia</option>
              <option value="sahara">Sahara</option>
            </select>
          </div>

          <button className="w-full border border-outline text-on-surface font-hankenGrotesk text-label-md uppercase py-2 hover:bg-surface-container transition-colors rounded-none">
            Apply Filters
          </button>
        </aside>

        {/* Results Area */}
        <section className="flex-1 p-margin-mobile md:p-8 bg-background">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <p className="font-hankenGrotesk text-body-md text-on-surface-variant">Showing <strong className="text-on-surface font-semibold">24</strong> artifacts for "Almoravid Maghreb"</p>
            <div className="flex items-center gap-4">
              <span className="font-hankenGrotesk text-data-mono text-outline uppercase">Sort by:</span>
              <select className="bg-transparent border-none text-primary font-hankenGrotesk text-label-md py-1 pl-0 pr-6 focus:ring-0 cursor-pointer uppercase">
                <option value="relevance">Relevance</option>
                <option value="date-asc">Date (Oldest)</option>
                <option value="date-desc">Date (Newest)</option>
              </select>
              <div className="flex border border-outline-variant ml-2">
                <button aria-label="Grid view" className="p-1 text-primary bg-surface-container-high">
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </button>
                <button aria-label="List view" className="p-1 text-outline hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">view_list</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bento-style Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <Link to="/artifact/1" className="block">
              <article className="archival-card group bg-surface-container-lowest border border-outline-variant flex flex-col relative overflow-hidden h-[420px]">
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  <span className="bg-surface-container-lowest/80 backdrop-blur-sm text-outline px-2 py-1 border border-outline-variant text-[10px] font-hankenGrotesk uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">menu_book</span> Manuscript
                  </span>
                </div>
                <div className="h-56 w-full relative border-b border-outline-variant/50 p-2 bg-surface-container-low">
                  <div className="w-full h-full border border-outline-variant/30 shadow-inner overflow-hidden">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZQhFxtDWhA_3R-T5g8CRV39_McJsEJLr-q44YZSLjLlKtn1xeVnyTmGe6beCnXuJ7_xwv17tZlvWm4rjUAzv_WKbHKxjHAhH7xwJTlLEWxro3e0ti55l45HkHZ0Jb7rbxXSlvfpjtPkBQvyiVhnHY8ZyXCtk4mI8O8bih-Q0QY7czUUm9_GVH4M5WOMFZjv3_AWvgxwmMwu2KQtkgTUZ9jjK3t5n1h9nWnomOactHylWK6h8UaYHGwPf5dEr7bnl4cAOnY6-LNPc" alt="Manuscript" className="w-full h-full object-cover grayscale-[20%] sepia-[10%] group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-ebGaramond text-headline-md text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors">Treatise on Maliki Law</h3>
                  <p className="font-hankenGrotesk text-body-md text-on-surface-variant line-clamp-2 mb-4 flex-1 text-sm">A fragmented manuscript detailing jurisprudence interpretations unique to the early Almoravid period in Marrakesh.</p>
                  <div className="flex flex-col gap-1 border-t border-outline-variant/40 pt-3 mt-auto">
                    <div className="flex justify-between items-center"><span className="font-hankenGrotesk text-data-mono text-outline">Date</span><span className="font-hankenGrotesk text-data-mono text-on-surface">c. 1085 CE</span></div>
                    <div className="flex justify-between items-center"><span className="font-hankenGrotesk text-data-mono text-outline">Origin</span><span className="font-hankenGrotesk text-data-mono text-on-surface">Marrakesh</span></div>
                  </div>
                </div>
              </article>
            </Link>

            {/* Card 2 */}
            <Link to="/artifact/2" className="block">
              <article className="archival-card group bg-surface-container-lowest border border-outline-variant flex flex-col relative overflow-hidden h-[420px]">
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  <span className="bg-surface-container-lowest/80 backdrop-blur-sm text-outline px-2 py-1 border border-outline-variant text-[10px] font-hankenGrotesk uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">category</span> Artifact
                  </span>
                </div>
                <div className="h-56 w-full relative border-b border-outline-variant/50 p-2 bg-surface-container-low">
                  <div className="w-full h-full border border-outline-variant/30 shadow-inner overflow-hidden flex items-center justify-center bg-[#f0eadd]">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzqnzfcTn7hQL2lRffX_JeawFLt51TYDo9Ar5Pf6HGALR3zQ51YxIvreS0sBQ8ci87buXQdvz9iajI3nHcwSfNveODlgJvY340b6c218MoU4GxJQCnd9bLdefM6p0Bnnmi9ADcQk9Gu8kiYWqwB7aUoe3Zz47sCCDsSYMacV4F1jckPIxuql8N26PUAPIaUhxn9p9k7bdLGzVNlJqATrbbbRa0VtFpFh_rVuTjphqXJDcaGYPPEOci7QTdE_MDIs9p2bqvoO7p7E4" alt="Tile" className="max-w-full max-h-full object-contain p-2 mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-ebGaramond text-headline-md text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors">Glazed Ceramic Star Tile</h3>
                  <p className="font-hankenGrotesk text-body-md text-on-surface-variant line-clamp-2 mb-4 flex-1 text-sm">Architectural fragment recovered from the ruins of the Ali bin Yusuf Mosque, demonstrating early geometric complexation.</p>
                  <div className="flex flex-col gap-1 border-t border-outline-variant/40 pt-3 mt-auto">
                    <div className="flex justify-between items-center"><span className="font-hankenGrotesk text-data-mono text-outline">Date</span><span className="font-hankenGrotesk text-data-mono text-on-surface">1120 CE</span></div>
                    <div className="flex justify-between items-center"><span className="font-hankenGrotesk text-data-mono text-outline">Material</span><span className="font-hankenGrotesk text-data-mono text-on-surface">Earthenware, Glaze</span></div>
                  </div>
                </div>
              </article>
            </Link>

            {/* Card 3 */}
            <Link to="/artifact/3" className="block">
              <article className="archival-card group bg-surface-container-lowest border border-outline-variant flex flex-col relative overflow-hidden h-[420px]">
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  <span className="bg-surface-container-lowest/80 backdrop-blur-sm text-outline px-2 py-1 border border-outline-variant text-[10px] font-hankenGrotesk uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">monetization_on</span> Numismatics
                  </span>
                </div>
                <div className="h-56 w-full relative border-b border-outline-variant/50 p-2 bg-surface-container-low">
                  <div className="w-full h-full border border-outline-variant/30 shadow-inner overflow-hidden flex items-center justify-center bg-[#1a1a1a]">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdH4P22t1a1mp1mQZ0PvKydT2mAQTIqc5iWX5ytYtSFZpaOPKCEhKr7IVtKvgLGooeDUyCoBrfRYMMlvbmQRIoEwc3Mmem3EjFnMagc7n_VwfKrQEfDc8o1OtNAJs927rRJNeSqlRmc-3_ThAjc19O_5GoOcsIUL8A2nZHa_glqjylLleqy6ATuVMCimndQkxHt8cg4WozupA2ubjnt_4mAMtzh8vUN_YIBImPw_AjPQFJZu5xLMRS-9wz47ru935UpqNGFgZvncA" alt="Coin" className="max-w-full max-h-full object-contain p-4 group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-ebGaramond text-headline-md text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors">Gold Dinar of Yusuf ibn Tashfin</h3>
                  <p className="font-hankenGrotesk text-body-md text-on-surface-variant line-clamp-2 mb-4 flex-1 text-sm">Standard coinage minted in Sijilmasa, crucial for understanding trans-Saharan trade networks.</p>
                  <div className="flex flex-col gap-1 border-t border-outline-variant/40 pt-3 mt-auto">
                    <div className="flex justify-between items-center"><span className="font-hankenGrotesk text-data-mono text-outline">Date</span><span className="font-hankenGrotesk text-data-mono text-on-surface">1092 CE</span></div>
                    <div className="flex justify-between items-center"><span className="font-hankenGrotesk text-data-mono text-outline">Mint</span><span className="font-hankenGrotesk text-data-mono text-on-surface">Sijilmasa</span></div>
                  </div>
                </div>
              </article>
            </Link>

            {/* Card 4 (Ledger) */}
            <Link to="/artifact/4" className="block lg:col-span-2">
              <article className="archival-card group bg-surface-container-lowest border border-outline-variant flex flex-col relative overflow-hidden h-[420px]">
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  <span className="bg-surface-container-lowest/80 backdrop-blur-sm text-outline px-2 py-1 border border-outline-variant text-[10px] font-hankenGrotesk uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">description</span> Ledger
                  </span>
                </div>
                <div className="p-8 flex flex-col h-full bg-[#fdfaf5] relative">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(var(--color-primary) 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>
                  <h3 className="font-ebGaramond text-display-lg text-primary mb-4 leading-none group-hover:text-on-primary-fixed-variant transition-colors relative z-10">Timbuktu Trade Ledger Fragment (Trans. H)</h3>
                  <div className="pattern-divider w-24 my-4 relative z-10"><span className="text-[8px] text-outline-variant mx-2">◆</span></div>
                  <div className="font-hankenGrotesk text-body-lg text-on-surface-variant mb-6 flex-1 relative z-10 max-w-2xl">
                    "On the fourth day of Shawwal, caravan arriving from the north... 40 measures of salt traded for equivalent weight in gold dust. The merchants speak of drought in the Atlas."
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-outline-variant/40 pt-4 mt-auto relative z-10">
                    <div><span className="block font-hankenGrotesk text-[10px] text-outline uppercase tracking-wider mb-1">Accession No.</span><span className="font-hankenGrotesk text-data-mono text-on-surface">TX-114-B</span></div>
                    <div><span className="block font-hankenGrotesk text-[10px] text-outline uppercase tracking-wider mb-1">Language</span><span className="font-hankenGrotesk text-data-mono text-on-surface">Arabic</span></div>
                    <div><span className="block font-hankenGrotesk text-[10px] text-outline uppercase tracking-wider mb-1">Subject</span><span className="font-hankenGrotesk text-data-mono text-on-surface">Commerce</span></div>
                    <div><span className="block font-hankenGrotesk text-[10px] text-outline uppercase tracking-wider mb-1">Status</span><span className="font-hankenGrotesk text-data-mono text-primary flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">verified</span> Authenticated</span></div>
                  </div>
                </div>
              </article>
            </Link>

            {/* Card 5 */}
            <Link to="/artifact/5" className="block">
              <article className="archival-card group bg-surface-container-lowest border border-outline-variant flex flex-col relative overflow-hidden h-[420px]">
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  <span className="bg-surface-container-lowest/80 backdrop-blur-sm text-outline px-2 py-1 border border-outline-variant text-[10px] font-hankenGrotesk uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">map</span> Cartography
                  </span>
                </div>
                <div className="h-56 w-full relative border-b border-outline-variant/50 p-2 bg-surface-container-low">
                  <div className="w-full h-full border border-outline-variant/30 shadow-inner overflow-hidden">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4NSYEmy87Xa1o5DqF1QyS0i8avOfTdquqWDDsaIkqIZ85lJo0h_3BXUc7Ho0vzFKE7NdnjjMeL9r11xu7X4wwO62GFbXTZ_DBaNPFMpu3kjP0_T8SmQvjpyCQYtK8lB7YrUPVoPcCgf-rEM-lnhuOQf0Ba_xPXdbRMd8fVYO0PAXgfJA0eshgprzn_qV9OpwEmYXwZdDtY2x7BWJX69BfNThnj2-Wnvs5vEP8RXKKX81WNOZy-4U8cpTdjOwXc0TccmY2YpiYA0E" alt="Map" className="w-full h-full object-cover grayscale-[30%] sepia-[20%] group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-ebGaramond text-headline-md text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors">Coastal Survey of Ceuta</h3>
                  <p className="font-hankenGrotesk text-body-md text-on-surface-variant line-clamp-2 mb-4 flex-1 text-sm">Early navigation chart depicting defensive structures and port depth soundings.</p>
                  <div className="flex flex-col gap-1 border-t border-outline-variant/40 pt-3 mt-auto">
                    <div className="flex justify-between items-center"><span className="font-hankenGrotesk text-data-mono text-outline">Date</span><span className="font-hankenGrotesk text-data-mono text-on-surface">c. 1135 CE</span></div>
                    <div className="flex justify-between items-center"><span className="font-hankenGrotesk text-data-mono text-outline">Medium</span><span className="font-hankenGrotesk text-data-mono text-on-surface">Ink on Vellum</span></div>
                  </div>
                </div>
              </article>
            </Link>

          </div>

          {/* Pagination */}
          <div className="mt-12 pt-6 border-t border-outline-variant flex justify-between items-center">
            <button className="flex items-center gap-2 text-outline hover:text-primary transition-colors font-hankenGrotesk text-label-md uppercase">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span> Prev
            </button>
            <div className="flex gap-2 font-hankenGrotesk text-data-mono">
              <button className="w-8 h-8 flex items-center justify-center bg-primary text-on-primary border border-primary">1</button>
              <button className="w-8 h-8 flex items-center justify-center text-on-surface-variant border border-outline-variant hover:border-primary transition-colors bg-surface-container-lowest">2</button>
              <button className="w-8 h-8 flex items-center justify-center text-on-surface-variant border border-outline-variant hover:border-primary transition-colors bg-surface-container-lowest">3</button>
              <span className="w-8 h-8 flex items-center justify-center text-outline">...</span>
              <button className="w-8 h-8 flex items-center justify-center text-on-surface-variant border border-outline-variant hover:border-primary transition-colors bg-surface-container-lowest">8</button>
            </div>
            <button className="flex items-center gap-2 text-primary hover:text-primary-fixed-variant transition-colors font-hankenGrotesk text-label-md uppercase">
              Next <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
