import { Navbar } from '@/components/home/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { BrandMarquee } from '@/components/home/BrandMarquee';
import { MembershipBanner } from '@/components/home/MembershipBanner';
import { LoyaltyTiersSection } from '@/components/home/LoyaltyTiersSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { AmenitiesSection } from '@/components/home/AmenitiesSection';
import { ShowcaseSection } from '@/components/home/ShowcaseSection';
import { Footer } from '@/components/home/Footer';

export default function HomePage() {
  return (
    <main className='flex flex-col'>
      <Navbar />
      <HeroSection />
      <BrandMarquee />
      <MembershipBanner />
      <LoyaltyTiersSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <AmenitiesSection />
      <ShowcaseSection />
      <Footer />
    </main>
  );
}
