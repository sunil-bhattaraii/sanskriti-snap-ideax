export default function MicroNavigation() {
  return (
    <section id="features" className="py-20 px-5 md:px-10 bg-surface-low scroll-mt-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="flex justify-center order-2 lg:order-1">
          <div className="bg-white p-4 rounded-2xl shadow-xl border border-surface-dim max-w-md w-full">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-surface-dim">
              <svg className="w-5 h-5 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="font-mono text-sm font-bold text-text-main">Heading North-East</span>
            </div>
            <div className="h-40 bg-surface-dim/50 rounded-xl mb-4 relative flex items-center justify-center">
              <div className="absolute w-full h-1 bg-terracotta/30 top-1/2 -translate-y-1/2"></div>
              <div className="absolute w-4 h-4 bg-terracotta rounded-full border-2 border-white shadow-md top-1/2 left-1/3 -translate-y-1/2"></div>
              <div className="bg-terracotta text-white font-mono text-xs font-bold px-3 py-1 rounded-full absolute bottom-4 right-4">180m Remaining</div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-surface-low rounded-lg mb-4">
              <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </div>
              <div className="flex-1">
                <h4 className="font-display font-bold text-sm text-text-main">Turn into Kwalkhu Gali</h4>
                <p className="font-body text-xs text-text-muted">Narrow stone pedestrian corridor</p>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text-muted">Accuracy: ± 2.4 meters</span>
              <span className="text-status-success font-bold">Optimal Sun Position</span>
            </div>
          </div>
        </div>

        <div className="space-y-8 order-1 lg:order-2">
          <div className="space-y-4">
            <span className="inline-block bg-gold/10 text-gold font-mono text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">Micro-Navigation</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-text-main">
              Effortless Walking Through <br /><span className="text-terracotta">Dense Historic Courtyards</span>
            </h2>
            <p className="font-body text-text-muted">Mainstream mapping services lose signal and resolution in the labyrinthine brick passages of historic Newari settlements. Our engine is mapped on foot, preserving alley clearances, stepped entranceways, and low torana passages.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "Passage Waypoints", desc: "Navigate by historic water wells and stone lions rather than generic highway prompts." },
              { title: "Full Offline Cache", desc: "Download valley sector trails beforehand with 100% offline navigation capability." }
            ].map((item) => (
              <div key={item.title} className="bg-white p-5 rounded-xl border border-surface-dim">
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                </div>
                <h4 className="font-display font-bold text-text-main mb-1">{item.title}</h4>
                <p className="font-body text-sm text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
