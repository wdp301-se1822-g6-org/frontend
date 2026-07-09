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

// Landing chỉ giữ các section phản ánh dữ liệu/dịch vụ có thật.
// Đã bỏ các section dựng nội dung không có nguồn: BrandMarquee (logo xe sang
// "trusted by"), TestimonialsSection (review + số liệu 4.9/10K/50K bịa),
// AmenitiesSection (tiện ích không tồn tại), BeforeAfterSection, ShowcaseSection,
// ContactSection (4 chi nhánh + form gửi giả). Liên hệ nay nằm ở Footer.
export default function HomePage() {
  return (
    <main className='flex flex-col'>
      <HomeGuard />
      <Navbar />
      <HeroSection />
      <AboutSection />
      <MembershipBanner />
      <LoyaltyTiersSection />
      <FeaturesSection />
      <HowItWorksSection />
      <Footer />
      <ScrollToTop />
    </main>
  );
}
