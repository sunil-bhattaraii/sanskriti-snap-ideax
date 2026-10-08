const steps = [
  { num: "01", title: "Spot & Search", desc: "Open the interactive vector map to discover hidden shrines, chibhas, and waterspouts within walking distance.", link: "Dynamic Radius" },
  { num: "02", title: "Walk & Navigate", desc: "Follow alleyway-level walking trails tailored to Kathmandu Valley’s ancient winding residential courtyards.", link: "Sub-meter Tracking" },
  { num: "03", title: "Unlock Story", desc: "Reach within 15 meters to unlock authentic historical lore, forgotten oral histories, and architectural context.", link: "Presence Gated" },
  { num: "04", title: "Snap & Verify", desc: "Frame the artifact with the in-app camera reticle. Our engine matches geometry and verifies your on-site capture.", link: "Instant Vision Match" },
  { num: "05", title: "Collect & Earn", desc: "Mint digital archival tokens in your personal collection, complete regional quests, and redeem perks at local artisan cafes.", link: "Gamified Badges" },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-5 md:px-10 bg-surface-low">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-bold text-terracotta tracking-widest uppercase">How It Works</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-text-main mt-2">The 5-Step Cultural Loop</h2>
            <p className="font-body text-text-muted mt-4">Sanskriti Snap turns casual walks into purposeful archaeological expeditions. Every step rewards presence, respect, and observation.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-text-muted">
            <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Physical Proximity Required
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((step) => (
            <div key={step.num} className="bg-white p-6 rounded-xl border border-surface-dim hover:shadow-lg transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-xs font-bold text-terracotta/50">{step.num}</span>
                <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
              </div>
              <h3 className="font-display font-bold text-lg text-text-main mb-2">{step.title}</h3>
              <p className="font-body text-sm text-text-muted mb-6 flex-1">{step.desc}</p>
              <a href="#" className="font-mono text-xs font-bold text-terracotta flex items-center gap-1 hover:gap-2 transition-all">
                {step.link} <span>→</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
