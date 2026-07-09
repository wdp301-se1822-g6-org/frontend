import { Navbar } from '@/components/home/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { AboutSection } from '@/components/home/AboutSection';
import { MembershipBanner } from '@/components/home/MembershipBanner';
import { LoyaltyTiersSection } from '@/components/home/LoyaltyTiersSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { HomeGuard } from '@/components/home/HomeGuard';
import { Footer } from '@/components/home/Footer';
import { ScrollToTop } from '@/components/home/ScrollToTop';
import { ShowcaseSection } from '@/components/home/ShowcaseSection';
import { BeforeAfterSection } from '@/components/home/BeforeAfterSection';
import { BrandMarquee } from '@/components/home/BrandMarquee';

export default function HomePage() {
  return (
    <main className='flex flex-col'>
      <HomeGuard />
      <Navbar />
      <HeroSection />
      <BrandMarquee />
      <AboutSection />
      <MembershipBanner />
      <BeforeAfterSection />
      <LoyaltyTiersSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ShowcaseSection />
      <Footer />
      <ScrollToTop />
    </main>
  );
}
