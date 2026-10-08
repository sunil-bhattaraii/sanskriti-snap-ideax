export default function Quests() {
  return (
    <section className="py-20 px-5 md:px-10 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <span className="inline-block bg-terracotta/10 text-terracotta font-mono text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">Cultural Progression</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-text-main">
              Gamified Quests & <span className="text-gold">Curated Collections</span>
            </h2>
            <p className="font-body text-text-muted">Level up from &#39;Novice Wanderer&#39; to &#39;Valley Epigraphist&#39;. Embark on curated thematic quests that weave through multiple monuments across different quadrants.</p>
          </div>

          <div className="space-y-4">
            {[
              { title: "Quest: Sacred Courtyards of Patan", desc: "Find 6 hidden Newari monasteries • 4/6 Completed", progress: 66 },
              { title: "Quest: Timeless Hitis (Waterspouts)", desc: "Catalog medieval subterranean spring systems • 2/5 Completed", progress: 40 }
            ].map((quest) => (
              <div key={quest.title} className="bg-white p-4 rounded-xl border border-surface-dim flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-text-main">{quest.title}</h4>
                    <p className="font-body text-xs text-text-muted mt-0.5">{quest.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:w-32">
                  <span className="font-mono text-xs font-bold text-terracotta">{quest.progress}%</span>
                  <div className="flex-1 h-2 bg-surface-dim rounded-full overflow-hidden">
                    <div className="h-full bg-terracotta rounded-full" style={{ width: `${quest.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-surface-dim max-w-sm w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-text-main flex items-center gap-2">
                <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Earned Artifact Badges
              </h3>
              <a href="#" className="font-mono text-xs font-bold text-terracotta">View Museum</a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Golden Spire", type: "LEGENDARY", color: "bg-rarity-legendary/10 text-rarity-legendary border-rarity-legendary" },
                { name: "Lichavi Script", type: "RARE ARTIFACT", color: "bg-rarity-rare/10 text-rarity-rare border-rarity-rare" },
                { name: "Garuda Stele", type: "COMMON", color: "bg-rarity-common/10 text-rarity-common border-rarity-common" },
                { name: "Bhairava Mask", type: "LOCKED QUEST", color: "bg-surface-dim/50 text-text-muted border-surface-dim" }
              ].map((badge) => (
                <div key={badge.name} className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 ${badge.color}`}>
                  <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  </div>
                  <span className="font-display font-bold text-sm text-text-main">{badge.name}</span>
                  <span className="font-mono text-[10px] font-bold tracking-wider">{badge.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
