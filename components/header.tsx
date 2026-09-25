'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Phone, ChevronDown } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'
import { useDiversity } from '@/components/diversity/diversity-provider'

const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/areas', label: 'Service Areas' },
  { href: '/locating', label: 'Line & Utility Locating', highlight: true },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { t } = useDiversity()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between min-h-20 md:min-h-28">
          {/* Logo — BIG badge at page top (hero presence), shrinks to header size on scroll so it never covers content. Transparent PNG, no box. */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 -ml-2 sm:-ml-4 md:-ml-6">
            <div className="relative w-28 h-20 md:w-40 md:h-28 flex-shrink-0">
              {/* Concentric: badge is big at page top and scales straight down
                  into the header around the SAME center — no left/right travel */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-300 ${scrolled ? 'h-24 w-24 md:h-36 md:w-36' : 'h-28 w-28 md:h-44 md:w-44'}`}>
                <Image
                  src="/logo.png"
                  alt="Precision Sewer Inspections"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="hidden min-[1700px]:flex flex-col">
              <span className="font-heading font-bold text-primary-900 text-xl leading-tight whitespace-nowrap">Precision Sewer</span>
              <span className="font-heading font-bold text-primary-900 text-xl leading-tight whitespace-nowrap">Inspections</span>
              <span className="text-sm text-gray-600 mt-0.5 whitespace-nowrap">Central Indiana&apos;s Trusted Experts</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5 min-w-0">
            {navLinks?.map((link) => (
              <Link
                key={link?.href ?? ''}
                href={link?.href ?? '/'}
                className={`px-2 xl:px-3 py-2 text-sm min-[1700px]:text-base font-medium rounded-lg transition-colors whitespace-nowrap ${
                  (link as { highlight?: boolean })?.highlight 
                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' 
                    : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
                }`}
              >
                {t(link?.label ?? '')}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            <a
              href={`tel:${COMPANY_INFO?.phoneRaw ?? ''}`}
              className="hidden min-[1700px]:flex items-center gap-2 text-primary-700 font-semibold hover:text-primary-800 transition-colors whitespace-nowrap flex-shrink-0"
            >
              <Phone className="w-4 h-4" />
              {COMPANY_INFO?.phone ?? ''}
            </a>
            <Link
              href="/contact"
              className="hidden sm:inline-flex btn-primary text-sm"
            >
              {t('Book Inspection')}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100"
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks?.map((link) => (
                <Link
                  key={link?.href ?? ''}
                  href={link?.href ?? '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 font-medium rounded-lg transition-colors ${
                    (link as { highlight?: boolean })?.highlight 
                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' 
                      : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
                  }`}
                >
                  {t(link?.label ?? '')}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100 mt-2">
                <a
                  href={`tel:${COMPANY_INFO?.phoneRaw ?? ''}`}
                  className="flex items-center gap-2 px-4 py-3 text-primary-700 font-semibold"
                >
                  <Phone className="w-5 h-5" />
                  {COMPANY_INFO?.phone ?? ''}
                </a>
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary w-full mt-2 justify-center"
                >
                  {t('Book Inspection')}
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
