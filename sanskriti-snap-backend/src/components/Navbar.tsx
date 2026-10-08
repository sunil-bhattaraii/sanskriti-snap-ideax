import Image from "next/image";
import Link from "next/link";
import { APK_DOWNLOAD_URL } from "@/lib/download";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-surface-dim">
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-4 flex items-center justify-between">
        <Link href="#home" className="flex items-center gap-2" aria-label="Sanskriti Snap — back to top">
          <Image src="/assets/images/logo.png" alt="Sanskriti Snap" width={226} height={185} className="h-8 w-auto" priority />
          <span className="font-display font-bold text-xl text-terracotta">Sanskriti Snap</span>
        </Link>

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
          <Link
            href={APK_DOWNLOAD_URL}
            className="bg-terracotta text-white font-mono font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-terracotta-deep transition-colors"
          >
            DOWNLOAD NOW
          </Link>
          <div className="w-9 h-9 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta font-bold text-sm">U</div>
        </div>
      </div>
    </nav>
  );
}
