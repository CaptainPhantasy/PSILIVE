'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { X, Tag, ArrowRight } from 'lucide-react'
import { PROMO_CODE, PROMO_PERCENT } from '@/lib/checkout-pricing'
import { motion, AnimatePresence } from 'framer-motion'
import { T, useDiversity } from '@/components/diversity/diversity-provider'

const DISCOUNT_AMOUNT = PROMO_PERCENT

export function setPromoDiscount() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('promoDiscount', JSON.stringify({
      code: PROMO_CODE,
      amount: DISCOUNT_AMOUNT,
      appliedAt: new Date().toISOString(),
    }))
  }
}

export function getPromoDiscount(): { code: string; amount: number } | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('promoDiscount')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        // Check if promo was applied within last 7 days
        const appliedAt = new Date(data.appliedAt)
        const now = new Date()
        const daysSince = (now.getTime() - appliedAt.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSince <= 7) {
          return { code: data.code, amount: data.amount }
        } else {
          localStorage.removeItem('promoDiscount')
        }
      } catch {
        localStorage.removeItem('promoDiscount')
      }
    }
  }
  return null
}

export function clearPromoDiscount() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('promoDiscount')
  }
}

// Routes where the promo banner should NOT appear
const HIDDEN_ROUTES = ['/technician', '/admin']

export default function PromoBanner() {
  const pathname = usePathname()
  const { t } = useDiversity()
  const [isVisible, setIsVisible] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)
  const [hasDiscount, setHasDiscount] = useState(false)

  // Hide on internal app routes
  const isHiddenRoute = HIDDEN_ROUTES.some(route => pathname?.startsWith(route))

  useEffect(() => {
    // Check if banner was dismissed this session
    const dismissed = sessionStorage.getItem('promoBannerDismissed')
    if (dismissed) {
      setIsDismissed(true)
    }
    // Check if discount already applied
    const discount = getPromoDiscount()
    if (discount) {
      setHasDiscount(true)
    }
  }, [])

  const handleDismiss = () => {
    sessionStorage.setItem('promoBannerDismissed', 'true')
    setIsDismissed(true)
  }

  const handleClick = () => {
    setPromoDiscount()
    setHasDiscount(true)
  }

  if (isDismissed || isHiddenRoute) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="promo-banner"
        >
          <Tag className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 animate-bounce" />
          
          <Link
            href="/contact"
            onClick={handleClick}
            className="flex items-center gap-2 group"
          >
            <span className="text-sm sm:text-base font-semibold">
              {hasDiscount ? (
                <span className="flex items-center gap-2">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs sm:text-sm">SAVE10 Applied!</span>
                  <span><T>Complete your booking to save 10%</T></span>
                </span>
              ) : (
                <>
                  <span className="hidden sm:inline"><T>Limited Time Offer:</T> </span>
                  <span className="code">10% OFF</span>
                  <span className="promo-cta"> <T>your first sewer inspection!</T></span>
                </>
              )}
            </span>
            <span className="flex items-center gap-1 font-bold underline underline-offset-2 group-hover:no-underline whitespace-nowrap">
              {hasDiscount ? <T>Book Now</T> : <T>Claim Discount</T>}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          
          <button
            onClick={handleDismiss}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label={t('Dismiss banner')}
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
