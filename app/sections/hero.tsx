
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Play, ArrowRight, MapPin, Clock, ShieldCheck, DollarSign } from 'lucide-react'
import { IDC_URL } from '@/lib/inspection-and-service'
import { useDiversity, T } from '@/components/diversity/diversity-provider'

const trustBadges = [
  { icon: ShieldCheck, value: 'HD', label: 'Video Evidence' },
  { icon: Clock, value: '1', label: 'Business-Day Reports' },
  { icon: DollarSign, value: '$159', label: 'Standard Cleanout Scope' },
  { icon: MapPin, value: '13', label: 'Local Service Areas' },
]

export default function HeroSection() {
  const { t } = useDiversity()
  return (
    <section className="cover">
      <div className="container">
        <div className="cover-grid">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Spacer: keeps hero text below the oversized header badge's overhang at page top */}
            <div className="h-20 md:h-44" aria-hidden="true" />
            <span className="eyebrow on-dark">
              {t('Sewer Inspections · Central Indiana')}
            </span>
            
            <h1>
              <T>Clear answers.</T> <em><T>A clearer way forward.</T></em>
            </h1>
            
            <p className="price-line">
              <T>Video evidence. Clear reporting. Your next step.</T>
            </p>
            
            <p className="lede-dark">
              <T>Buying a property, dealing with a recurring sewer problem, or weighing a proposed repair? PSI inspects what is accessible, records the findings and explains the limits so you can decide what happens next.</T>
            </p>

            {/* CTA Buttons */}
            <div className="ctas">
              <Link href="/contact" className="btn btn-accent">
                {t('Book an Inspection')}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href={IDC_URL} className="btn btn-outline-dark">
                {t('Need drain service? Visit IDC')}
              </a>
            </div>

            {/* Trust Badges */}
            <div className="trust-grid">
              {trustBadges?.map((badge, index) => {
                const IconComponent = badge?.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="cell"
                  >
                    {IconComponent && <IconComponent className="w-5 h-5 text-accent-400 mx-auto mb-2" />}
                    <div className="k">{t(badge?.label ?? '')}</div>
                    <div className="v">
                      {badge.value}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Right Content - Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="tech-card"
          >
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', borderRadius: '16px', overflow: 'hidden' }}>
              <Image
                src="/images/tech_hero.jpg"
                alt="Sewer camera inspection"
                fill
                className="object-cover"
                priority
              />
            </div>
            
            <div className="ribbon">
              <div className="lead">InterNACHI Member</div>
              <div className="meta">Fully Insured</div>
            </div>
            
            <div className="cert-bump">
              <div className="ic">
                <ShieldCheck style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="text">
                <div className="a"><T>Inspection Findings First</T></div>
                <div className="b"><T>You Choose the Next Step</T></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
