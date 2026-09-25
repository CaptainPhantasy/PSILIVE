import type { Metadata } from 'next'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AIChat from '@/components/ai-chat'
import Link from 'next/link'
import { Check, ArrowRight, Info, Phone, AlertCircle, Building2, Users, Video } from 'lucide-react'
import { ACCESS_METHODS, MULTI_UNIT_PRICING, VOLUME_PACKAGES, COMPANY_INFO } from '@/lib/constants'
import { T } from '@/components/diversity/diversity-provider'

const PRICING_CARDS = [
  {
    name: 'Free Video Second Opinion',
    description: 'Free Expert Opinion',
    price: '$0',
    priceLabel: '/ review',
    badge: 'Free Service',
    badgeColor: 'bg-secondary-500',
    features: [
      'Free Sewer Video Second Opinion',
      'No-Jargon Explanation of Findings',
      'Report Reviewed if Provided',
      'One-Business-Day Response',
      'Next-Step Guidance When You Ask',
      'No Purchase Required'
    ],
    cta: 'Submit Video',
    href: '/video-review',
    featured: false
  },
  {
    name: 'Standard Sewer Scope',
    description: 'Clear, Upfront Pricing',
    price: '$159',
    priceLabel: 'per inspection (cleanout access)',
    badge: 'Standard Inspection',
    badgeColor: 'bg-accent-500',
    features: [
      'HD Video Recording',
      'HD images and factual summary with no jargon',
      'One-Business-Day Delivery',
      'Standard Cleanout Access',
      'Phone Consultation',
      'Additional Work Only With Your Approval'
    ],
    cta: 'Book Now',
    href: '/contact',
    featured: true
  },
  {
    name: 'Volume Packages',
    description: 'Brokerages & Investors',
    price: 'Call for Pricing',
    priceLabel: '',
    badge: null,
    badgeColor: '',
    features: [
      '10+ Scope Prepaid Bundles',
      'Per-Scope Discounts',
      'Priority Scheduling',
      'Dedicated Account Support',
      'Annual Package Options'
    ],
    cta: 'Get Quote',
    href: '/contact',
    featured: false
  }
]

export const metadata: Metadata = {
  title: 'Sewer Scope Cost Indianapolis | $159 Standard',
  description: 'Sewer inspection pricing in Indianapolis. Standard rate $159. Multi-unit discounts, volume packages for investors. Transparent pricing, no hidden fees.',
  openGraph: {
    title: 'Sewer Scope Pricing | Indianapolis | Precision Sewer Inspections',
    description: 'Transparent sewer inspection pricing. Standard rate $159. Volume packages available. No surprises.',
  },
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary-50 py-8 px-4"><div className="max-w-4xl mx-auto"><h2 className="text-xl font-bold mb-3">Agree on the scope before the work.</h2><p>The $159 standard scope uses a usable cleanout and includes the existing video, written findings and phone consultation package below. Access charges are listed separately. Multiple lines, locating, pump systems and inspection-enabling cleaning are scoped before you approve a price.</p><p className="mt-3">If access or visibility limits the inspection, we record the accessible sections, the stopping point and what remains unknown. You may decline additional access or cleaning. We explain any applicable access or trip charge before proceeding; a clear view of every section is not guaranteed.</p></div></section>
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-1 bg-primary-700 text-primary-200 text-sm font-semibold rounded-full mb-6">
                <T>Transparent Pricing</T>
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                <T>Clear, Upfront Pricing</T>
              </h1>
              <p className="text-xl text-primary-200">
                <T>Premium reporting quality with transparent pricing. Know exactly what you&apos;ll pay before we arrive.</T>
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {PRICING_CARDS.map((card, index) => (
                <div
                  key={index}
                  className={`card-pricing relative ${card.featured ? 'featured' : ''}`}
                >
                  {card.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 ${card.badgeColor} text-white text-xs font-semibold px-4 py-1 rounded-full`}>
                      <T>{card.badge}</T>
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-1"><T>{card.name}</T></h3>
                  <p className="text-sm text-gray-500 mb-4"><T>{card.description}</T></p>
                  <div className="mb-6">
                    <span className="text-5xl font-heading font-bold text-gray-900"><T>{card.price}</T></span>
                    {card.priceLabel && <span className="text-gray-500 block text-sm mt-1"><T>{card.priceLabel}</T></span>}
                  </div>
                  <ul className="space-y-3 mb-8 text-left">
                    {card.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-5 h-5 text-secondary-500 flex-shrink-0 mt-0.5" />
                        <span><T>{feature}</T></span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={card.href}
                    className={`w-full justify-center ${
                      card.featured ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {card.name === 'Free Video Second Opinion' && <Video className="w-4 h-4 mr-1" />}
                    <T>{card.cta}</T>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Access Methods */}
        <section className="section-padding bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 text-center mb-4">
              <T>Access Method Pricing</T>
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              <T>Price varies by access type. Please confirm access availability before your appointment to avoid delays or additional charges.</T>
            </p>

            <div className="space-y-4">
              {ACCESS_METHODS?.map((method, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="mb-4 sm:mb-0">
                    <h3 className="font-semibold text-gray-900"><T>{method?.method ?? ''}</T></h3>
                    <p className="text-sm text-gray-500"><T>{method?.description ?? ''}</T></p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-700"><T>{method?.price ?? ''}</T></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1"><T>Important Access Information</T></h4>
                  <p className="text-sm text-amber-800">
                    <T>Some older systems may have buried or hard-to-locate clean-outs that require additional effort. If access cannot be established after reasonable effort, alternative access methods or additional charges may apply. We&apos;ll always discuss options with you before proceeding.</T>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-6 bg-primary-50 rounded-xl border border-primary-200">
              <div className="flex gap-3">
                <Info className="w-6 h-6 text-primary-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-primary-900 mb-1"><T>Same-Day Delivery Option</T></h4>
                  <p className="text-sm text-primary-700">
                    Need it faster? Add same-day delivery for $39.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Unit Pricing */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Building2 className="w-8 h-8 text-primary-600" />
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">
                <T>Multi-Family Properties</T>
              </h2>
            </div>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              <T>Discounted rates for duplexes, triplexes, and apartment buildings.</T>
            </p>

            <div className="space-y-4 max-w-xl mx-auto">
              {MULTI_UNIT_PRICING?.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white rounded-xl border border-gray-200"
                >
                  <div className="mb-4 sm:mb-0">
                    <h3 className="font-semibold text-gray-900"><T>{item?.units ?? ''}</T></h3>
                    <p className="text-sm text-gray-500"><T>{item?.description ?? ''}</T></p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-700"><T>{item?.price ?? ''}</T></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Volume Packages */}
        <section className="section-padding bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Users className="w-8 h-8 text-primary-600" />
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">
                <T>Prepaid Volume Packages</T>
              </h2>
            </div>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              <T>Brokerage and investor packages with cost savings and priority scheduling. Purchase upfront and save on every scope.</T>
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {VOLUME_PACKAGES?.map((pkg, index) => (
                <div
                  key={index}
                  className="p-6 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2"><T>{pkg?.name ?? ''}</T></h3>
                  <p className="text-sm text-gray-500 mb-4"><T>{pkg?.description ?? ''}</T></p>
                  <div className="mb-4">
                    <span className="text-xl font-bold text-primary-700"><T>{pkg?.price ?? ''}</T></span>
                  </div>
                  <ul className="space-y-2">
                    {pkg?.features?.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-secondary-500 flex-shrink-0 mt-0.5" />
                        <span><T>{feature ?? ''}</T></span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/contact" className="btn-primary">
                <T>Purchase Volume Package</T>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4"><T>Ready to Book?</T></h2>
            <p className="text-gray-600 mb-8">
              <T>Schedule your inspection online in 60 seconds or call us for immediate assistance.</T>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-cta">
                <T>Book Inspection</T>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={`tel:${COMPANY_INFO?.phoneRaw ?? ''}`}
                className="btn-secondary"
              >
                <Phone className="w-5 h-5" />
                {COMPANY_INFO?.phone ?? ''}
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
