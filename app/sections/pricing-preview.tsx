'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Link from 'next/link'
import { Check, ArrowRight, Video } from 'lucide-react'
import { T } from '@/components/diversity/diversity-provider'

const PREVIEW_CARDS = [
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

export default function PricingPreview() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="psi" data-screen-label="Pricing">
      <div className="container">
        
        <div className="section-head">
          <span className="eyebrow"><T>Pricing</T></span>
          <h2 className="psi"><span className="rule"></span><T>Transparent Pricing, No Surprises</T></h2>
          <p className="lede"><T>We believe in upfront, honest pricing. What you see is what you pay—no surprises.</T></p>
        </div>

        <div ref={ref} className="pricing-grid">
          {PREVIEW_CARDS.map((card, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.15 }}
              className={`access-card ${card.featured ? 'featured' : ''}`}
            >
              {/* Badges kept intact */}
              {card.badge && (
                <span className={`badge ${card.badge === 'Free Service' ? 'alt' : ''}`}>
                  <T>{card.badge}</T>
                </span>
              )}

              <h3><T>{card.name}</T></h3>
              <div className="desc"><T>{card.description}</T></div>
              
              <div className="price">
                <span className="amt" style={card.price === 'Call for Pricing' ? { fontSize: '24px' } : undefined}><T>{card.price}</T>
                </span>
                {card.priceLabel && <span className="unit"><T>{card.priceLabel}</T></span>}
              </div>
              
              {/* Inline style overrides the CSS ::before element so the Lucide icon renders cleanly */}
              <style>{`.access-card ul li { display: flex; align-items: flex-start; gap: 10px; } .access-card ul li::before { display: none !important; }`}</style>
              <ul>
                {card.features.map((feature, i) => (
                  <li key={i}>
                    <Check size={18} strokeWidth={1.5} color="currentColor" style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent)' }} />
                    <span><T>{feature}</T></span>
                  </li>
                ))}
              </ul>
              
              <div className="cta-row">
                <Link
                  href={card.href}
                  className={`btn ${card.featured ? 'btn-accent' : 'btn-outline-light'}`}
                >
                  {card.name === 'Free Video Second Opinion' && <Video size={16} strokeWidth={1.5} color="currentColor" style={{ marginRight: '6px' }} />}
                  <T>{card.cta}</T>
                  <ArrowRight size={16} strokeWidth={1.5} color="currentColor" style={{ marginLeft: '6px' }} />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="pricing-foot">
          <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <T>View Full Pricing Details</T> <ArrowRight size={14} strokeWidth={1.5} color="currentColor" />
          </Link>
        </div>
        
      </div>
    </section>
  )
}
