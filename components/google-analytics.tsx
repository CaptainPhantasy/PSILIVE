'use client'

import { useEffect } from 'react'
import { GoogleAnalytics as NextGoogleAnalytics } from '@next/third-parties/google'
import { GA_MEASUREMENT_ID, isAnalyticsEnabled } from '@/lib/analytics'

export default function GoogleAnalytics() {
  // Enable Enhanced Conversions on the GA config
  useEffect(() => {
    if (!isAnalyticsEnabled()) return
    const gtag = (window as Record<string, unknown>).gtag as ((...args: unknown[]) => void) | undefined
    if (typeof gtag === 'function') {
      gtag('config', GA_MEASUREMENT_ID, {
        allow_enhanced_conversions: true,
      })
    }
  }, [])

  if (!isAnalyticsEnabled()) {
    return null
  }
  return <NextGoogleAnalytics gaId={GA_MEASUREMENT_ID} />
}
