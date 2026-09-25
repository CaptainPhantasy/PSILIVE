'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import SectionHeading from '@/components/section-heading'
import { FAQ_ITEMS } from '@/lib/constants'
import Link from 'next/link'
import { T } from '@/components/diversity/diversity-provider'

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="psi">
      <div className="container">
        <div className="faq-wrap">
          <SectionHeading
            label="FAQ"
            title="Frequently Asked Questions"
            description="Get quick answers to common questions about sewer inspections."
            icon={HelpCircle}
          />

          <div className="space-y-4">
            {FAQ_ITEMS?.slice(0, 5)?.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="faq"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className={`w-full flex items-center justify-between text-left ${openIndex === index ? 'open' : ''}`}
                >
                  <div className="summary" onClick={(e) => e.preventDefault()}>
                    <span className="q"><T>{item?.question ?? ''}</T></span>
                    <ChevronDown
                      className={`chev ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="a">
                        <p><T>{item?.answer ?? ''}</T></p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <div className="faq-foot">
            <Link href="/faq">
              <T>View All FAQs</T> →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
