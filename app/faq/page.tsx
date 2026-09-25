'use client'

import { useState } from 'react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AIChat from '@/components/ai-chat'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, Phone } from 'lucide-react'
import { FAQ_ITEMS, COMPANY_INFO } from '@/lib/constants'
import Link from 'next/link'
import { CONVERSATIONAL_FAQS } from '@/lib/constants'
import { T, useDiversity } from '@/components/diversity/diversity-provider'
import StructuredData from '@/components/structured-data'

const additionalFAQs = [
  {
    question: 'What areas do you serve?',
    answer: "Our shared Central Indiana coverage includes Avon, Brownsburg, Carmel, Fishers, Franklin, Geist, Greenfield, Greenwood, Indianapolis, Noblesville, Plainfield, Westfield and Zionsville. We confirm your exact address, access, service suitability and availability before scheduling.",
  },
  {
    question: 'Do you provide repair services?',
    answer: "PSI provides inspection findings and clear reporting. Our sister company, Indiana Drain Company, offers optional cleaning, maintenance, and qualifying repair services. When you ask for guidance, we can discuss practical next steps and a separate quote where appropriate. You may choose IDC, another provider, or no additional service; your findings do not depend on that choice.",
  },
  {
    question: 'How do I prepare for the inspection?',
    answer: "Please confirm access to your clean-out before your appointment. If we're accessing via an outdoor cleanout, make sure we can reach it. If we need to access via toilet or roof vent, we'll coordinate with you ahead of time. Remember, a $79 trip fee may apply on a case-by-case basis if access cannot be provided as confirmed.",
  },

  {
    question: 'Can I watch the inspection?',
    answer: "Absolutely! We love when customers watch. It helps you understand exactly what we're looking at and lets you ask questions in real-time. That said, it's not required—you'll get the full video regardless.",
  },
  {
    question: "What's included in the written report?",
    answer: 'Your premium report includes a summary of findings, condition ratings for different sections of the line, photos from the video, documentation of any issues found, and an overall assessment. Everything is explained with no jargon. Our reports are designed for transparency and quality.',
  },
  {
    question: 'How do I get my video and report?',
    answer: "Your HD video link and PDF report are emailed to you within one business day of the inspection. You can share them with anyone—contractors, real estate agents, etc.",
  },
  {
    question: 'What about multi-unit or commercial properties?',
    answer: 'We offer discounted rates for multi-family properties: $159 for the first unit and $129 for each additional unit when using the same access point. For commercial properties and high-volume needs, contact us for custom pricing.',
  },
  {
    question: 'Do you offer any discounts or packages?',
    answer: 'Yes! We offer prepaid volume packages for real estate professionals and investors. Our 10-scope bundles and 25-scope brokerage packages include per-scope discounts and priority scheduling.',
  },
]



const allFAQs = [...(CONVERSATIONAL_FAQS ?? []), ...(FAQ_ITEMS ?? []), ...(additionalFAQs ?? [])]

export default function FAQPage() {
  const { t } = useDiversity()
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFAQs = allFAQs?.filter((faq) => {
    const query = searchQuery?.toLowerCase() ?? ''
    // Match the translated/displayed strings (what the user actually sees and
    // searches against) in addition to the English originals.
    const question = t(faq?.question ?? '')?.toLowerCase?.() ?? ''
    const answer = t(faq?.answer ?? '')?.toLowerCase?.() ?? ''
    return (
      question.includes(query) ||
      answer.includes(query) ||
      faq?.question?.toLowerCase?.()?.includes?.(query) ||
      faq?.answer?.toLowerCase?.()?.includes?.(query)
    )
  })

  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData type="FAQPage" faqs={allFAQs} />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-1 bg-primary-700 text-primary-200 text-sm font-semibold rounded-full mb-6">
                <T>FAQ</T>
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                <T>Frequently Asked Questions</T>
              </h1>
              <p className="text-xl text-primary-200 mb-8">
                <T>Everything you need to know about sewer inspections in Central Indiana.</T>
              </p>
              
              {/* Search */}
              <div className="relative max-w-lg mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('Search questions...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value ?? '')}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="section-padding bg-white">
          <div className="max-w-3xl mx-auto">
            {filteredFAQs?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500"><T>No questions found matching</T> &quot;{searchQuery}&quot;</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQs?.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenIndex(openIndex === index ? null : index)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 pr-4"><T>{item?.question ?? ''}</T></span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                          openIndex === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {openIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-6 py-4 bg-white border-t border-gray-100">
                            <p className="text-gray-600 whitespace-pre-line"><T>{item?.answer ?? ''}</T></p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Still have questions */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4"><T>Still Have Questions?</T></h2>
            <p className="text-gray-600 mb-8">
              <T>Our team is happy to answer any questions you have about sewer inspections.</T>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-primary">
                <T>Contact Us</T>
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
