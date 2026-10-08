import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-surface-dim">
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Image src="/assets/images/logo.png" alt="Sanskriti Snap" width={32} height={32} className="h-8 w-8" priority />
            <span className="font-display font-bold text-xl text-terracotta">Sanskriti Snap</span>
          </div>
          <span className="font-mono text-[10px] font-bold bg-surface-low px-2 py-1 rounded text-text-muted">NEPAL HERITAGE</span>
        </div>

        <ul className="hidden lg:flex items-center gap-8">
          {["Home", "Features", "How It Works", "Heritage Discoveries", "Quests & Rewards", "About"].map((item) => (
            <li key={item}>
              <Link href="#" className={`text-sm font-medium ${item === "Home" ? "text-terracotta" : "text-text-muted hover:text-terracotta"} transition-colors`}>
                {item}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <Link href="#download" className="bg-terracotta text-white font-mono font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-terracotta-deep transition-colors">
            DOWNLOAD NOW
          </Link>
          <div className="w-9 h-9 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta font-bold text-sm">U</div>
        </div>
      </div>
    </nav>
  );
}
