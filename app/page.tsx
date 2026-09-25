import Header from '@/components/header'
import Footer from '@/components/footer'
import AIChat from '@/components/ai-chat'
import StructuredData from '@/components/structured-data'
import { FAQ_ITEMS } from '@/lib/constants'
import HeroSection from './sections/hero'
import WhyChooseUs from './sections/why-choose-us'
import HowItWorks from './sections/how-it-works'
import WhatWeFind from './sections/what-we-find'
import Testimonials from './sections/testimonials'
import PricingPreview from './sections/pricing-preview'
import ServiceAreas from './sections/service-areas'
import FAQSection from './sections/faq-section'
import FinalCTA from './sections/final-cta'
import InspectionServiceIntro from '@/components/inspection-service-intro'
import InspectionPaths from '@/components/inspection-paths'
import FindingsExplained from '@/components/findings-explained'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData type="LocalBusiness" />
      <StructuredData type="FAQPage" faqs={FAQ_ITEMS.slice(0, 5)} />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <InspectionPaths />
        <WhyChooseUs />
        <HowItWorks />
        <WhatWeFind />
        <FindingsExplained />
        <InspectionServiceIntro />
        <Testimonials />
        <PricingPreview />
        <ServiceAreas />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
      <AIChat />
    </div>
  )
}
