import type { Metadata } from 'next'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AIChat from '@/components/ai-chat'
import StructuredData from '@/components/structured-data'
import SectionHeading from '@/components/section-heading'
import Link from 'next/link'
import Image from 'next/image'
import { Camera, Building2, Home, Users, Check, ArrowRight, Shield, Clock, Video } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'
import { T } from '@/components/diversity/diversity-provider'
import InspectionServiceIntro from '@/components/inspection-service-intro'
import FindingsExplained from '@/components/findings-explained'

export const metadata: Metadata = {
  title: 'Sewer Scope Services Indianapolis | Residential, Commercial & Real Estate',
  description: 'Professional sewer inspection services in Indianapolis. Residential sewer scope from $159, commercial inspections, and real estate partner programs. HD video, one-business-day reports. Book today.',
  openGraph: {
    title: 'Sewer Inspection Services | Precision Sewer Inspections Indianapolis',
    description: 'Residential, commercial, and real estate sewer scope inspections. HD video, one-business-day delivery, InterNACHI member.',
  },
  alternates: {
    canonical: '/services',
  },
}

const services = [
  {
    id: 'recurring-blockages', icon: Camera, title: 'Recurring Sewer Blockage Investigation',
    subtitle: 'Understand what keeps returning',
    description: 'A standalone camera investigation starts with your history of backups and earlier clearing. We document the accessible line, visible buildup or defects and where the view stops. An observed obstruction may not establish its underlying cause. Cleaning is a separate decision.',
    features: ['Recorded Accessible Sections', 'Blockage and Defect References', 'Possible Causes Kept Separate', 'Limits and Next Questions Explained'],
    price: 'Scope confirmed before booking',
  },
  {
    id: 'sewer-locating', icon: Camera, title: 'Sewer & Drain Locating',
    subtitle: 'Find the accessible line before planning more work',
    description: 'Where a camera sonde or traceable line provides a usable signal, we can mark an approximate route or point at the surface. Agree on any depth estimates, footage references or basic route sketch before the visit. A locate is not a survey or engineered map, and not every buried line can be traced.',
    features: ['Accessible Sewer and Drain Routes', 'Surface Marks Where Traceable', 'Approximate Readings with Limits', 'No Excavation Included'],
    price: 'Scope confirmed before booking',
  },
  {
    id: 'pump-inspection',
    icon: Camera,
    title: 'Pump Inspections',
    subtitle: 'Clear Findings for Accessible Pump Systems',
    description: 'Inspection of accessible household and pool pump systems after confirming the system type, access, and safe testing scope. Many systems need cleaning first; we explain why and agree the price before any cleaning begins. Highly specialized systems require a suitable specialist. Preventive pump and basin cleaning is also available through Indiana Drain Company.',
    features: ['System and Access Review', 'Visible Findings and Limitations', 'Cleaning Separately Approved', 'Next-Step Guidance on Request'],
    price: 'Custom Quote',
  },
  {
    id: 'residential',
    icon: Home,
    title: 'Residential Sewer Scope',
    subtitle: 'For Homeowners & Home Buyers',
    description: 'HD video inspection of the visible, accessible portions of your main sewer line, with any access limitations documented. Perfect for home buyers, homeowners, and anyone wanting to know the true condition of their sewer line.',
    features: [
      'HD Video Recording',
      'Written Report with Findings',
      'One-Business-Day Report Delivery',
      'Expert Explanation With No Jargon',
      'Digital Copy for Your Records',
      'Inspection Findings First',
    ],
    price: 'From $159',

  },
  {
    id: 'commercial',
    icon: Building2,
    title: 'Commercial Inspections',
    subtitle: 'For Businesses & Property Managers',
    description: 'Inspection of agreed, accessible lines at commercial properties, multi-unit buildings and investment properties. Tell us the number of lines or laterals, access points and operating restrictions. Findings identify which line was inspected and which sections could not be reached. Discuss repeat condition checks with us so the scope and timing fit the property.',
    features: [
      'Multi-Unit Pricing Available',
      'Volume Discounts',
      'Detailed Documentation',
      'Dedicated Account Manager',
      'Flexible Scheduling',
      'Repeat Inspection Scope by Agreement',
    ],
    price: 'Custom Quote',
    image: '/images/tech_hero.jpg',
  },
  {
    id: 'real-estate',
    icon: Users,
    title: 'Real Estate Partner Program',
    subtitle: 'For Agents & Brokers',
    description: 'Fast, reliable inspections designed for real estate professionals. We understand the time pressure of transactions and deliver when you need it.',
    features: [
      'Priority Scheduling',
      'One-Business-Day Reports',
      'Direct Inspector Access',
      'Agent-Friendly Reports',
      'Quick Turnaround',
      'Multi-Property Volume Pricing',
    ],
    price: 'Partner Pricing',
  },
]

const benefits = [
  { icon: Shield, title: 'InterNACHI Member', description: 'Membership verifiable at nachi.org/verify' },
  { icon: Video, title: 'HD Equipment', description: 'Professional grade high-definition camera systems' },
  { icon: Clock, title: 'One-Business-Day Delivery', description: 'Reports delivered within one business day' },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData type="Service" />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-1 bg-primary-700 text-primary-200 text-sm font-semibold rounded-full mb-6">
                <T>Our Services</T>
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                <T>Professional Sewer Inspection Services</T>
              </h1>
              <p className="text-xl text-primary-200">
                <T>Evidence-based inspections for homeowners, businesses, and real estate professionals throughout Central Indiana.</T>
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Bar */}
        <section className="bg-gray-50 border-b border-gray-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-center gap-6 md:gap-12">
              {benefits?.map((benefit, index) => {
                const IconComponent = benefit?.icon
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      {IconComponent && <IconComponent className="w-5 h-5 text-primary-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm"><T>{benefit?.title ?? ''}</T></p>
                      <p className="text-gray-500 text-xs"><T>{benefit?.description ?? ''}</T></p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-16">
              {[services[3], services[0], services[1], services[4], services[5], services[2]].map((service, index) => {
                const IconComponent = service?.icon
                return (
                  <div
                    key={service?.id ?? index}
                    id={service.id}
                    className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                      index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                    }`}
                  >
                    <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                          {IconComponent && <IconComponent className="w-6 h-6 text-primary-600" />}
                        </div>
                        <div>
                          <h2 className="text-2xl font-heading font-bold text-gray-900">
                            <T>{service?.title ?? ''}</T>
                          </h2>
                          <p className="text-primary-600 text-sm font-medium"><T>{service?.subtitle ?? ''}</T></p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-6"><T>{service?.description ?? ''}</T></p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {service?.features?.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-gray-700">
                            <Check className="w-5 h-5 text-secondary-500 flex-shrink-0" />
                            <span className="text-sm"><T>{feature ?? ''}</T></span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-gray-900">{service?.price ?? ''}</span>
                        <Link href={service?.id === 'real-estate' ? '/realtors' : service.id === 'sewer-locating' ? '/locating#sewer-drain' : '/contact'} className="btn-primary">
                          <T>{service?.id === 'real-estate' ? 'Partner With Us' : service?.price === 'Custom Quote' ? 'Get Quote' : 'Book Now'}</T>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                    {service?.image && (
                      <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                        <Image
                          src={service.image}
                          alt="Sewer inspection"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Secondary Services */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <SectionHeading
              title="Secondary Services"
              description="Supporting work that makes your inspection better — offered alongside the scope, never instead of it."
            />
            <div className="grid md:grid-cols-2 gap-8 mt-10">
              <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
                <div className="relative w-40 h-40 mb-6">
                  <Image src="/images/jetting-logo.png" alt="Precision Sewer Inspections hydro jetting" fill className="object-contain" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2"><T>Hydro Jetting</T></h3>
                <p className="text-primary-700 font-semibold mb-4"><T>Clears the way for a proper scope</T></p>
                <p className="text-gray-600 mb-4">
                  <T>If roots, grease, scale, or debris prevent a clear view, we explain whether cleaning or hydro jetting could improve access. The scope and price are agreed separately before work begins. If cleaning is declined, we report what was visible and document the limitation.</T>
                </p>
                <p className="text-gray-900 font-bold"><T>Separately quoted. Only with your approval.</T></p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
                <div className="relative w-40 h-40 mb-6">
                  <Image src="/images/pls_logo.png" alt="Precision Location Services private utility locating" fill className="object-contain" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2"><T>Private Utility Locating</T></h3>
                <p className="text-primary-700 font-semibold mb-4"><T>Electronic line tracing &amp; depth measurement</T></p>
                <p className="text-gray-600 mb-4">
                  <T>Traceable private wiring and suitable accessible lines, subject to signal and access limits. Private utility locating has a different scope from following a sewer camera sonde. Confirm the target and required markings before booking.</T>
                </p>
                <Link href="/locating" className="text-primary-700 font-bold hover:underline">
                  <T>Learn more</T> →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <FindingsExplained />
        <InspectionServiceIntro />

        {/* CTA */}
        <section className="section-padding bg-primary-900 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-heading font-bold mb-4"><T>Ready to Get Started?</T></h2>
            <p className="text-primary-200 mb-8">
              <T>Book your professional sewer inspection today or call us to discuss your specific needs.</T>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-cta">
                <T>Book Inspection</T>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={`tel:${COMPANY_INFO?.phoneRaw ?? ''}`}
                className="btn-secondary bg-transparent border-primary-300 text-white hover:bg-primary-800"
              >
                <T>Call</T> {COMPANY_INFO?.phone ?? ''}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <AIChat />
    </div>
  )
}
