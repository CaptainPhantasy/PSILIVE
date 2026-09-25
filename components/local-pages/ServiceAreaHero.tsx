'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck } from 'lucide-react'

import { T, useDiversity } from '@/components/diversity/diversity-provider'
import { MapPin, Clock, DollarSign } from 'lucide-react'

interface ServiceAreaHeroProps {
  cityName: string
  state: string
  description?: string | null
  phone: string
}

const trustBadges = [
  { icon: ShieldCheck, value: 'HD', label: 'Video Evidence', suffix: '' },
  { icon: Clock, value: '1', label: 'Business-Day Reports', suffix: '' },
  { icon: DollarSign, value: '$159', label: 'Standard Cleanout Scope', suffix: '' },
  { icon: MapPin, value: '13', label: 'Local Service Areas', suffix: '' },
]

export default function ServiceAreaHero({
  cityName,
  state,
  description,
  phone,
}: ServiceAreaHeroProps) {
  const { t } = useDiversity()
  return (
    <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] bg-repeat" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1 bg-accent-500/20 text-accent-400 text-sm font-semibold rounded-full mb-6">
              {cityName}, {state} <T>Sewer Experts</T>
            </span>
            
            <h1 className="text-hero text-white mb-6">
              <T>Professional Sewer Inspection in</T> <span className="text-accent-400">{cityName}</span>
            </h1>
            
            <p className="text-xl text-primary-200 mb-4">
              <T>Clear evidence for your next decision.</T>
            </p>
            
            <p className="text-lg text-primary-300 mb-8 max-w-lg">
              {description || <><T>Expert sewer camera inspections serving</T> {cityName} <T>and surrounding communities. HD video reports with honest answers.</T></>}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link 
                href="/contact" 
                className="btn-cta"
              >
                <T>Book an Inspection</T>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href={`tel:${phone}`}
                className="btn-secondary bg-transparent border-primary-300 text-white hover:bg-primary-700/50"
              >
                Call Now
              </a>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {trustBadges?.map((badge, index) => {
                const IconComponent = badge?.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
                  >
                    {IconComponent && <IconComponent className="w-5 h-5 text-accent-400 mx-auto mb-2" />}
                    <div className="text-2xl font-bold text-white">
                      {badge.value}
                    </div>
                    <div className="text-xs text-primary-300"><T>{badge?.label ?? ''}</T></div>
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
            className="relative hidden lg:block"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/tech_hero.jpg"
                alt={t('Sewer camera inspection')}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">InterNACHI Member</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
