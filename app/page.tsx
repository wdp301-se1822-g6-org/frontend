import { Navbar } from '@/components/home/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { PackagesSection } from '@/components/home/PackagesSection';
import { LoyaltyTiersSection } from '@/components/home/LoyaltyTiersSection';
import { MembershipBanner } from '@/components/home/MembershipBanner';
import { ContactSection } from '@/components/home/ContactSection';
import { HomeGuard } from '@/components/home/HomeGuard';
import { Footer } from '@/components/home/Footer';
import { ScrollToTop } from '@/components/home/ScrollToTop';

export default function HomePage() {
  return (
    <main className='flex flex-col'>
      <HomeGuard />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PackagesSection />
      <LoyaltyTiersSection />
      <MembershipBanner />
      <ContactSection />
      <Footer />
      <ScrollToTop />
    </main>
  );
}
