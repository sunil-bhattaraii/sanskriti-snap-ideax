import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import StoryUnlocking from "@/components/StoryUnlocking";
import MicroNavigation from "@/components/MicroNavigation";
import Quests from "@/components/Quests";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip">
      <Navbar />
      <Hero />
      <HowItWorks />
      <StoryUnlocking />
      <MicroNavigation />
      <Quests />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
