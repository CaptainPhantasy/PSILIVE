import { sendGAEvent } from '@next/third-parties/google'

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'

export const isAnalyticsEnabled = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    Boolean(GA_MEASUREMENT_ID) &&
    GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX'
  )
}

interface GAEvent {
  action: string
  category?: string
  label?: string
  value?: number
}

// Helper to access the global gtag function
function getGtag(): ((...args: unknown[]) => void) | null {
  if (typeof window !== 'undefined' && typeof (window as Record<string, unknown>).gtag === 'function') {
    return (window as Record<string, unknown>).gtag as (...args: unknown[]) => void
  }
  return null
}

/**
 * Enhanced Conversions: Set user-provided data so Google can match
 * conversion events to signed-in Google accounts. Call this whenever
 * user data (email, phone) becomes available, e.g. on form field blur.
 */
export interface UserProvidedData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  street?: string
  city?: string
  region?: string
  postalCode?: string
  country?: string
}

export function setUserData(data: UserProvidedData): void {
  if (!isAnalyticsEnabled()) return
  const gtag = getGtag()
  if (!gtag) return

  try {
    // Build the user_data object — only include non-empty values
    const userData: Record<string, unknown> = {}

    if (data.email?.trim()) {
      userData.email = data.email.trim().toLowerCase()
    }
    if (data.phone?.trim()) {
      // Normalize phone: ensure it starts with country code
      let phone = data.phone.trim().replace(/[^\d+]/g, '')
      if (phone && !phone.startsWith('+')) {
        phone = '+1' + phone // Default to US country code
      }
      userData.phone_number = phone
    }
    if (data.firstName?.trim() || data.lastName?.trim()) {
      userData.address = {
        ...(data.firstName?.trim() && { first_name: data.firstName.trim() }),
        ...(data.lastName?.trim() && { last_name: data.lastName.trim() }),
        ...(data.street?.trim() && { street: data.street.trim() }),
        ...(data.city?.trim() && { city: data.city.trim() }),
        ...(data.region?.trim() && { region: data.region.trim() }),
        ...(data.postalCode?.trim() && { postal_code: data.postalCode.trim() }),
        ...(data.country?.trim() ? { country: data.country.trim() } : { country: 'US' }),
      }
    }

    // Only send if we have at least email or phone
    if (userData.email || userData.phone_number) {
      gtag('set', 'user_data', userData)
    }
  } catch (e) {
    console.error('GA set user_data error:', e)
  }
}

export function trackEvent({ action, category, label, value }: GAEvent): void {
  if (!isAnalyticsEnabled()) return
  try {
    sendGAEvent('event', action, {
      event_category: category,
      event_label: label,
      value,
    })
  } catch (e) {
    console.error('GA Event error:', e)
  }
}

/**
 * Track a conversion event. This sends the event through GA and
 * relies on user_data already being set via setUserData().
 */
export function trackConversion(conversionLabel: string, value?: number): void {
  if (!isAnalyticsEnabled()) return
  try {
    sendGAEvent('event', 'conversion', {
      send_to: `${GA_MEASUREMENT_ID}/${conversionLabel}`,
      value: value,
    })
  } catch (e) {
    console.error('GA conversion error:', e)
  }
}

export const analytics = {
  trackPageView: (url: string) => trackEvent({ action: 'page_view', label: url }),
  trackFormStart: (formName: string) => trackEvent({ action: 'form_start', category: 'engagement', label: formName }),
  trackFormSubmission: (formName: string, success: boolean) =>
    trackEvent({ action: 'form_submit', category: 'conversion', label: `${formName}_${success ? 'success' : 'fail'}` }),
  trackCTAClick: (ctaName: string) => trackEvent({ action: 'cta_click', category: 'engagement', label: ctaName }),
  trackPhoneClick: () => trackEvent({ action: 'phone_click', category: 'contact', label: 'header_phone' }),
  trackChatOpen: () => trackEvent({ action: 'chat_open', category: 'engagement', label: 'ai_chat' }),
  setUserData,
  trackConversion,
}
