import type { Metadata } from 'next'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AIChat from '@/components/ai-chat'
import StructuredData from '@/components/structured-data'
import SectionHeading from '@/components/section-heading'
import DemoReport from '@/components/demo-report'
import RealtorLeadForm from '@/components/realtor-lead-form'
import RealtorFaq from '@/components/realtor-faq'
import Link from 'next/link'
import {
  Shield, Award, BadgeCheck, Ban, ArrowRight, Phone, CalendarClock,
  FileText, Video, Clock, Handshake, MapPin, Eye, Scale, Timer,
} from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'
import { SERVICE_AREA_LINKS } from '@/lib/service-areas'
import { T } from '@/components/diversity/diversity-provider'

const BBB_PROFILE_URL =
  'https://www.bbb.org/us/in/indianapolis/profile/sewer-inspection/precision-sewer-inspection-llc-0382-90068319'

export const metadata: Metadata = {
  title: 'Realtor Sewer Scope Indianapolis | Partner Program for Agents & Brokers',
  description:
    'The sewer scope built for real estate transactions: pre-listing and buyer scope inspections across Central Indiana with priority scheduling and one-business-day reports. Evidence-led reporting with optional service guidance when requested.',
  openGraph: {
    title: 'Sewer Scope Partner Program for Real Estate Agents | Precision Sewer Inspections',
    description:
      'Pre-listing and buyer sewer scopes across Central Indiana. Priority scheduling, one-business-day reports, and findings that inform without inflating.',
  },
  alternates: {
    canonical: '/realtors',
  },
}

const trustItems = [
  {
    icon: Award,
    title: 'InterNACHI Member',
    description: 'Membership verifiable at nachi.org/verify',
  },
  {
    icon: Shield,
    title: 'Fully Insured',
    description: 'Coverage on every inspection',
  },
  {
    icon: BadgeCheck,
    title: 'BBB Accredited',
    description: 'Accredited business profile',
    href: BBB_PROFILE_URL,
  },
  {
    icon: Ban,
    title: 'Your Client Stays in Control',
    description: 'Findings first; service by choice',
  },
]

const whyAgents = [
  {
    icon: Scale,
    title: 'Findings That Inform Without Inflating',
    description:
      'We document what the camera shows and explain the limitations. If your client asks for next-step guidance, optional service through our sister company, Indiana Drain Company, is discussed separately from the inspection findings.',
  },
  {
    icon: Eye,
    title: 'Buyer Hands-Off Ready',
    description:
      'Every inspection includes the full HD video and a plain-language written report your buyer can read without a translator. Forward it, attach it to the file, done.',
  },
  {
    icon: FileText,
    title: 'A Published Standard Behind Every Report',
    description:
      "Inspections performed to InterNACHI's published Sewer Scope Standards of Practice, so the report reads the same on every transaction.",
  },
]

const windowSteps = [
  {
    icon: Timer,
    step: 'Step 1',
    title: 'Book an Inspection',
    description:
      'Online booking or one phone call. Transparent flat pricing is published — no quote-chasing while the inspection window ticks.',
  },
  {
    icon: CalendarClock,
    step: 'Step 2',
    title: 'We Coordinate Access',
    description:
      'We work directly with you, the seller, or the occupant to confirm clean-out access and appointment timing. Priority scheduling for partner agents.',
  },
  {
    icon: Video,
    step: 'Step 3',
    title: 'Report + Video Within One Business Day',
    description:
      'The HD video and written report arrive by email within one business day — inside even a tight 7–10 day inspection window.',
  },
]

const partnerBenefits = [
  'Priority scheduling inside the inspection window',
  'Direct inspector access — no call-center runaround',
  'Agent-friendly reports written to be forwarded',
  'Multi-property volume pricing for your whole book of business',
]

// These exact Q&As are what the page renders — the FAQPage JSON-LD below is
// scoped to this same list (never a broader set).
const REALTOR_FAQS = [
  {
    question: 'Should my buyer get a sewer scope on an older Indianapolis home?',
    answer:
      'Yes — especially in Central Indiana, where many older homes still have clay tile or cast iron lines that deteriorate over decades. A $159 scope documents the visible condition of the line before your buyer is responsible for it.',
  },
  {
    question: 'Does a standard home inspection cover the sewer line?',
    answer:
      'A standard home inspection typically excludes a sewer-camera scope. Some home inspectors offer it separately; confirm the scope before booking.',
  },
  {
    question: 'How long does a sewer scope take, and when do we get the report?',
    answer:
      'Most inspections take 30–60 minutes on site. The HD video and written report are emailed within one business day, so results land well inside a standard 7–10 day inspection window.',
  },
  {
    question: 'How much does a sewer scope cost?',
    answer:
      'The standard inspection is $159 with clean-out access, including HD video and a written report within one business day. Alternate access methods cost a bit more (roof vent +$50, toilet pull +$65, crawl space +$30), and all pricing is confirmed before work begins.',
  },
  {
    question: 'Can you work inside our inspection window?',
    answer:
      'Yes. Partner agents get priority scheduling, we coordinate access directly with the seller or occupant, and the report and video are delivered within one business day of the inspection.',
  },
  {
    question: 'Do you sell repairs or refer contractors?',
    answer:
      'PSI provides inspection findings and clear reporting. Our sister company, Indiana Drain Company, offers optional cleaning, maintenance, and qualifying repair services. When you ask for guidance, we can discuss practical next steps and a separate quote where appropriate. You may choose IDC, another provider, or no additional service; your findings do not depend on that choice.',
  },
]

export default function RealtorsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData type="LocalBusiness" />
      <StructuredData type="FAQPage" faqs={REALTOR_FAQS} />
      <Header />
      <main className="flex-1">
        {/* 1. Hero */}
        <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-1 bg-primary-700 text-primary-200 text-sm font-semibold rounded-full mb-6">
                <T>For Real Estate Agents &amp; Brokers</T>
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                <T>The sewer scope your deal can schedule around</T>
              </h1>
              <p className="text-xl text-primary-200 mb-8">
                <T>
                  Sewer scope inspections for real estate professionals, with HD video and a clear written report delivered within one business day. Your client gets factual findings first, with practical next-step guidance available when requested.
                </T>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact" className="btn-cta">
                  <T>Book an Inspection</T>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <DemoReport buttonClassName="btn-secondary bg-transparent border-primary-300 text-white hover:bg-primary-800" />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Trust bar */}
        <section className="bg-gray-50 border-b border-gray-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {trustItems?.map((item, index) => {
                const IconComponent = item?.icon
                const inner = (
                  <>
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      {IconComponent && <IconComponent className="w-5 h-5 text-primary-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm"><T>{item?.title ?? ''}</T></p>
                      <p className="text-gray-500 text-xs"><T>{item?.description ?? ''}</T></p>
                    </div>
                  </>
                )
                return item?.href ? (
                  <a
                    key={index}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={index} className="flex items-center gap-3">
                    {inner}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 3. Clear information for your client’s decision */}
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              label="Evidence at Every Step"
              title="Clear information for your client’s decision"
              description="Video, written findings, and inspection limitations help your buyer understand the property and decide what comes next."
            />
            <div className="grid md:grid-cols-3 gap-8">
              {whyAgents?.map((item, index) => {
                const IconComponent = item?.icon
                return (
                  <div key={index} className="bg-gray-50 rounded-2xl p-8">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                      {IconComponent && <IconComponent className="w-6 h-6 text-primary-600" />}
                    </div>
                    <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">
                      <T>{item?.title ?? ''}</T>
                    </h3>
                    <p className="text-gray-600"><T>{item?.description ?? ''}</T></p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 4. Built for the inspection window */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              label="Transaction Speed"
              title="Built for the inspection window"
              description="A 7–10 day window leaves no room for slow scheduling or slow reports. Our process is built around your timeline."
            />
            <div className="grid md:grid-cols-3 gap-8">
              {windowSteps?.map((step, index) => {
                const IconComponent = step?.icon
                return (
                  <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                        {IconComponent && <IconComponent className="w-6 h-6 text-secondary-600" />}
                      </div>
                      <span className="text-sm font-semibold text-secondary-600 uppercase tracking-wider">
                        <T>{step?.step ?? ''}</T>
                      </span>
                    </div>
                    <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">
                      <T>{step?.title ?? ''}</T>
                    </h3>
                    <p className="text-gray-600"><T>{step?.description ?? ''}</T></p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 5. Demo block */}
        <section className="section-padding bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <SectionHeading
              label="Show, Don't Tell"
              title="See exactly what your buyer gets"
              description="Open the sample report below — same format, same detail, same video links your clients receive on every inspection."
            />
            <DemoReport />
          </div>
        </section>

        {/* 6. Partner Program + lead form */}
        <section className="section-padding bg-primary-900 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center">
                    <Handshake className="w-4 h-4 text-primary-200" />
                  </div>
                  <span className="text-sm font-semibold text-primary-300 uppercase tracking-wider">
                    <T>Partner Program</T>
                  </span>
                </div>
                <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                  <T>One agent. Many addresses. One inspector you never have to explain twice.</T>
                </h2>
                <p className="text-primary-200 mb-6">
                  <T>
                    Your buyers cycle through addresses all year. Partner agents get a standing arrangement instead of a fresh transaction every time.
                  </T>
                </p>
                <ul className="space-y-3">
                  {partnerBenefits?.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3 text-primary-100">
                      <BadgeCheck className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                      <span><T>{benefit ?? ''}</T></span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-gray-900">
                <RealtorLeadForm />
              </div>
            </div>
          </div>
        </section>

        {/* 7. Coverage */}
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              label="Coverage"
              title="Your farm area is our service area"
              description="Live coverage across the Indianapolis metro — click any city for its local page."
              icon={MapPin}
            />
            <div className="flex flex-wrap justify-center gap-3">
              {SERVICE_AREA_LINKS?.map((area) => (
                <Link
                  key={area.slug}
                  href={`/sewer-inspection/${area.slug}`}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  {area.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Agent FAQ */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <SectionHeading
              label="Agent FAQ"
              title="Questions agents ask us"
            />
            <RealtorFaq faqs={REALTOR_FAQS} />
          </div>
        </section>

        {/* 9. Final CTA */}
        <section className="section-padding bg-primary-900 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-primary-300" />
            <h2 className="text-3xl font-heading font-bold mb-4">
              <T>Inspection window open? Let&apos;s move.</T>
            </h2>
            <p className="text-primary-200 mb-8">
              <T>Book online in about a minute, or call and we&apos;ll get your transaction on the schedule.</T>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-cta">
                <T>Book an Inspection</T>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={`tel:${COMPANY_INFO?.phoneRaw ?? ''}`}
                className="btn-secondary bg-transparent border-primary-300 text-white hover:bg-primary-800"
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
