import Link from "next/link";
import { APK_DOWNLOAD_URL } from "@/lib/download";

export default function CTA() {
  return (
    <section id="download" className="py-20 px-5 md:px-10">
      <div className="max-w-7xl mx-auto bg-terracotta rounded-3xl p-8 md:p-16 text-white relative overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6">
            <span className="inline-block bg-white/20 text-white font-mono text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">Begin Your Expedition Today</span>
            <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight">Ready to Uncover Nepal’s Hidden Stories?</h2>
            <p className="font-body text-white/80 max-w-lg">Download the Sanskriti Snap mobile companion app. Free forever for independent explorers, students, and valley wanderers.</p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href={APK_DOWNLOAD_URL} className="bg-white text-terracotta font-mono font-bold text-sm px-6 py-3 rounded-lg hover:bg-surface-low transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>DOWNLOAD NOW</span>
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="bg-white p-6 rounded-2xl text-text-main text-center shadow-2xl">
              <div className="w-40 h-40 bg-surface-dim rounded-xl mx-auto mb-4 flex items-center justify-center text-text-muted">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              </div>
              <h4 className="font-display font-bold text-lg">Scan with Phone Camera</h4>
              <span className="font-mono text-[10px] font-bold text-text-muted tracking-wider uppercase">Instant Install Link</span>
            </div>
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-terracotta-deep rounded-full opacity-50 blur-3xl"></div>
      </div>
    </section>
  );
}
