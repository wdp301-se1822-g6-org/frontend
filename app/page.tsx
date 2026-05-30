import { Navbar } from '@/components/home/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { BrandMarquee } from '@/components/home/BrandMarquee';
import { AboutSection } from '@/components/home/AboutSection';
import { MembershipBanner } from '@/components/home/MembershipBanner';
import { BeforeAfterSection } from '@/components/home/BeforeAfterSection';
import { LoyaltyTiersSection } from '@/components/home/LoyaltyTiersSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { ContactSection } from '@/components/home/ContactSection';
import { AmenitiesSection } from '@/components/home/AmenitiesSection';
import { ShowcaseSection } from '@/components/home/ShowcaseSection';
import { HomeGuard } from '@/components/home/HomeGuard';
import { Footer } from '@/components/home/Footer';
import { ScrollToTop } from '@/components/home/ScrollToTop';

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
      <TestimonialsSection />
      <ContactSection />
      <AmenitiesSection />
      <ShowcaseSection />
      <Footer />
      <ScrollToTop />
    </main>
  );
}
