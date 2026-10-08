import Image from "next/image";
import Link from "next/link";
import { APK_DOWNLOAD_URL } from "@/lib/download";

export default function Hero() {
  return (
    <section id="home" className="py-16 md:py-24 px-5 md:px-10 max-w-7xl mx-auto scroll-mt-20">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-text-main">
              Discover Nepal <br />
              <span className="text-terracotta">Beyond the Guidebooks</span>
            </h1>
            <p className="font-body text-lg text-text-muted max-w-xl leading-relaxed">
              An interactive cultural exploration app that turns overlooked heritage, hidden shrines, and timeless courtyards into a rewarding discovery journey across Kathmandu Valley.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link href={APK_DOWNLOAD_URL} className="bg-terracotta text-white font-mono font-bold text-sm px-6 py-3 rounded-lg hover:bg-terracotta-deep transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <div className="flex flex-col items-start">
                <span>DOWNLOAD FREE</span>
                <span className="text-[10px] font-normal opacity-80">ANDROID BETA RELEASE</span>
              </div>
            </Link>
            <Link href="#how-it-works" className="border-2 border-surface-dim text-text-main font-mono font-bold text-sm px-6 py-3 rounded-lg hover:border-terracotta hover:text-terracotta transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              See How It Works
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-surface-dim">
            {[
              { num: "50+", label: "CURATED HIDDEN SITES" },
              { num: "100%", label: "FREE EXPLORATION" },
              { num: "Patan", label: "VALLEY PILOT LIVE" },
              { num: "GPS", label: "VERIFIED PRESENCE" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <div className="font-display font-bold text-xl text-terracotta">{stat.num}</div>
                <div className="font-mono text-[10px] font-bold text-text-muted tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phone Mockup Showcase — app screenshots */}
        <div className="relative flex items-center justify-center w-full min-h-[520px]">
          {/* Phone 1: Explore map — slides out from behind the centre screen */}
          <div className="hidden sm:block absolute left-4 top-10 w-[150px] xl:w-[180px] z-10 hero-phone-left">
            <div className="bg-slate-charcoal rounded-[2.5rem] p-2 shadow-2xl -rotate-[10deg] transition-transform duration-500 hover:-translate-x-3 hover:-translate-y-3 motion-reduce:transition-none">
              <div className="relative w-full h-[380px] rounded-[2rem] overflow-hidden bg-surface-low">
                <Image
                  src="/assets/images/exolore map screenshot.webp"
                  alt="Explore map of nearby heritage sites"
                  fill
                  sizes="180px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Phone 2: Home screen */}
          <div className="relative w-[220px] xl:w-[250px] bg-slate-charcoal rounded-[3rem] p-3 shadow-2xl z-20 hover:-translate-y-2 transition-transform duration-300 motion-reduce:transition-none">
            <div className="relative w-full h-[480px] rounded-[2.5rem] overflow-hidden bg-surface-low">
              <Image
                src="/assets/images/main landing page.webp"
                alt="Sanskriti Snap home screen"
                fill
                priority
                sizes="250px"
                className="object-cover"
              />
            </div>
          </div>

          {/* Phone 3: Leaderboard — slides out from behind the centre screen */}
          <div className="hidden sm:block absolute right-4 top-16 w-[150px] xl:w-[180px] z-10 hero-phone-right">
            <div className="bg-slate-charcoal rounded-[2.5rem] p-2 shadow-2xl rotate-[10deg] transition-transform duration-500 hover:translate-x-3 hover:-translate-y-3 motion-reduce:transition-none">
              <div className="relative w-full h-[380px] rounded-[2rem] overflow-hidden bg-surface-low">
                <Image
                  src="/assets/images/leaderblard screenshot.webp"
                  alt="Heritage leaderboard screen"
                  fill
                  sizes="180px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
