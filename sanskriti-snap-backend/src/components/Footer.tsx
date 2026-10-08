import Image from "next/image";
import Link from "next/link";
import { APK_DOWNLOAD_URL } from "@/lib/download";

export default function Footer() {
  return (
    <footer className="bg-surface-dim/30 border-t border-surface-dim py-16 px-5 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <Link href="#home" className="flex items-center gap-2 w-fit" aria-label="Sanskriti Snap — back to top">
              <Image src="/assets/images/logo.png" alt="Sanskriti Snap" width={226} height={185} className="h-8 w-auto" />
              <span className="font-display font-bold text-xl text-terracotta">Sanskriti Snap</span>
            </Link>
            <p className="font-body text-sm text-text-muted">Discover, Learn, and Collect Nepal&apos;s Overlooked Heritage. An exploratory digital companion connecting travelers, researchers, and locals with ancient monuments.</p>
            <Link href={APK_DOWNLOAD_URL} className="inline-flex items-center gap-2 bg-terracotta text-white font-mono font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-terracotta-deep transition-colors w-fit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              DOWNLOAD NOW
            </Link>
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
