export default function StoryUnlocking() {
  return (
    <section id="heritage" className="py-20 px-5 md:px-10 max-w-7xl mx-auto scroll-mt-20">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="space-y-8 order-2 lg:order-1">
          <div className="space-y-4">
            <span className="inline-block bg-terracotta/10 text-terracotta font-mono text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">On-Location Enrichment</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-text-main">
              Story Unlocking on Arrival: <br /><span className="text-terracotta">No Spoilers from the Couch</span>
            </h2>
            <p className="font-body text-text-muted">Conventional travel apps surrender all lore upfront. Sanskriti Snap respects cultural sanctity by holding deep stories in reserve until you stand in front of the monument.</p>
          </div>

          <div className="space-y-6">
            {[
              { title: "The Place, The Story, Why It Matters", desc: "Structured three-tier storytelling verified by local historians, epigraphists, and Newar community elders." },
              { title: "Hidden Iconography Trivia", desc: "Discover overlooked carvings, tantric symbols, and centuries-old architectural counterweights invisible to the untrained eye." }
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface-low flex items-center justify-center text-terracotta shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <div>
                  <h4 className="font-display font-bold text-text-main">{item.title}</h4>
                  <p className="font-body text-sm text-text-muted mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2 flex justify-center">
          <div className="bg-white p-4 rounded-2xl shadow-xl border border-surface-dim max-w-sm w-full">
            <div className="h-48 bg-slate-charcoal rounded-xl mb-4 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-white/50 font-mono text-sm">Monastery Image</div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <span className="bg-rarity-rare text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">RARE MONUMENT</span>
                <h3 className="font-display font-bold text-white text-lg mt-1">I Baha Bahi Monastery <span className="text-white/70 text-sm font-normal">14th Century</span></h3>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Status", val: "Unlocked", color: "text-status-success" },
                { label: "Architect", val: "Malla Era", color: "text-text-main" },
                { label: "Bounty", val: "+200 XP", color: "text-gold" }
              ].map((item) => (
                <div key={item.label} className="bg-surface-low p-2 rounded-lg text-center">
                  <div className="font-mono text-[10px] text-text-muted uppercase">{item.label}</div>
                  <div className={`font-display font-bold text-sm ${item.color}`}>{item.val}</div>
                </div>
              ))}
            </div>
            <div className="bg-surface-low p-3 rounded-lg border-l-2 border-terracotta">
              <span className="font-mono text-[10px] font-bold text-terracotta uppercase">Curator Note</span>
              <p className="font-body text-xs text-text-muted mt-1 italic">&quot;Look closely at the northern lintel: an unbroken carved motif represents the seven celestial nagas protecting the subterranean spring.&quot;</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
