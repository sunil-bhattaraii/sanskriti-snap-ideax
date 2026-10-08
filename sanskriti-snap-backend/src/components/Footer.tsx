import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-surface-dim/30 border-t border-surface-dim py-16 px-5 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image src="/assets/images/logo.png" alt="Sanskriti Snap" width={32} height={32} className="h-8 w-8" />
              <span className="font-display font-bold text-xl text-terracotta">Sanskriti Snap</span>
            </div>
            <p className="font-body text-sm text-text-muted">Discover, Learn, and Collect Nepal&apos;s Overlooked Heritage. An exploratory digital companion connecting travelers, researchers, and locals with ancient monuments.</p>
            <div className="flex gap-3 pt-2">
              {["App Store", "Google Play"].map((store) => (
                <div key={store} className="flex items-center gap-1 bg-white border border-surface-dim px-2 py-1.5 rounded cursor-pointer">
                  <div className="w-4 h-4 bg-surface-dim rounded-sm"></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-mono font-bold text-text-muted leading-none">Download On</span>
                    <span className="text-[10px] font-bold text-text-main leading-tight">{store}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold text-text-muted tracking-widest uppercase mb-4">Exploration</h4>
            <ul className="space-y-2">
              {["Kathmandu Valley Shrines", "Patan Hidden Chibhas", "Bhaktapur Stone Inscriptions", "Architectural Expeditions"].map((item) => (
                <li key={item}><Link href="#" className="font-body text-sm text-text-main hover:text-terracotta transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold text-text-muted tracking-widest uppercase mb-4">Platform</h4>
            <ul className="space-y-2">
              {["Verification Engine", "Curator Community", "Artifact Registry", "Heritage Leaderboard"].map((item) => (
                <li key={item}><Link href="#" className="font-body text-sm text-text-main hover:text-terracotta transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold text-text-muted tracking-widest uppercase mb-4">Preservation</h4>
            <div className="bg-white p-4 rounded-lg border border-surface-dim">
              <span className="font-display font-bold text-sm text-terracotta block mb-1">National Heritage Partner</span>
              <p className="font-body text-xs text-text-muted">Curated in synergy with the Department of Archaeology and local preservation trusts across Nepal.</p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-dim flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-xs text-text-muted">&copy; 2025 Sanskriti Snap. Preserving living cultural history through open verification.</p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Archival Guidelines"].map((item) => (
              <Link key={item} href="#" className="font-body text-xs text-text-muted hover:text-terracotta transition-colors">{item}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
