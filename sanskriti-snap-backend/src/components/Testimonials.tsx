export default function Testimonials() {
  const testimonials = [
    { text: "I walked past an unassuming wooden doorway in Lalitpur every single day for three months. Sanskriti Snap prompted me to step through, revealing a pristine 600-year-old courtyard. Unforgettable.", name: "Aayush Rajbhandari", role: "Architect & Lalitpur Native", initials: "AR", bg: "bg-terracotta/10 text-terracotta" },
    { text: "The story unlocking on arrival is brilliant. It stopped me from rushing through photo ops and forced me to actually pause, absorb the iconography, and appreciate the living worship culture.", name: "Elena Hayes", role: "Independent Cultural Traveler", initials: "EH", bg: "bg-gold/10 text-gold" },
    { text: "Unlike commercial tourism apps that degrade living heritage, Sanskriti Snap emphasizes sacred etiquette and donates data records back to local preservation trusts.", name: "Prof. B. Maharjan", role: "Kathmandu Valley Researcher", initials: "PM", bg: "bg-blue-100 text-blue-600" }
  ];

  return (
    <section className="py-20 px-5 md:px-10 bg-surface-low">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-mono text-xs font-bold text-terracotta tracking-widest uppercase">Voices of the Trail</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-text-main mt-2">Loved by Travelers & Heritage Custodians</h2>
          <p className="font-body text-text-muted mt-4">Bridging international curiosity with local preservation and sacred Newari traditions.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white p-6 rounded-xl border border-surface-dim flex flex-col">
              <p className="font-body text-text-muted italic mb-6 flex-1">&quot;{t.text}&quot;</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm ${t.bg}`}>{t.initials}</div>
                <div>
                  <h4 className="font-display font-bold text-sm text-text-main">{t.name}</h4>
                  <p className="font-body text-xs text-text-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-xl border border-surface-dim flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <h4 className="font-display font-bold text-text-main">Our Living Heritage Pledge</h4>
              <p className="font-body text-sm text-text-muted">We never gamify active private shrines or sacred funeral sites. All data adheres to Department of Archaeology guidelines.</p>
            </div>
          </div>
          <a href="#" className="font-mono text-xs font-bold text-terracotta border border-terracotta px-4 py-2 rounded-lg hover:bg-terracotta hover:text-white transition-colors whitespace-nowrap">Read Archival Ethics</a>
        </div>
      </div>
    </section>
  );
}
