'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = sessionStorage.getItem('_st_sid')
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem('_st_sid', sid)
  }
  return sid
}

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown'
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

function getBrowser(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edg')) return 'Edge'
  return 'Other'
}

function getOS(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return 'Other'
}

function getUTMParams(): Record<string, string | undefined> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
    utmTerm: params.get('utm_term') || undefined,
    utmContent: params.get('utm_content') || undefined,
  }
}

export default function SiteTracker() {
  const pathname = usePathname()
  const startTime = useRef(Date.now())
  const maxScroll = useRef(0)
  const visitId = useRef<string | null>(null)
  const isFirstPage = useRef(true)

  const sendBeacon = useCallback((url: string, data: Record<string, unknown>) => {
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, JSON.stringify(data))
      } else {
        fetch(url, { method: 'POST', body: JSON.stringify(data), keepalive: true })
      }
    } catch { /* silent */ }
  }, [])

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        const pct = Math.round((scrollTop / docHeight) * 100)
        if (pct > maxScroll.current) maxScroll.current = pct
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Track page view on route change
  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith('/admin') || pathname.startsWith('/technician')) return

    // Send exit data for previous page
    if (visitId.current) {
      const timeOnPage = Math.round((Date.now() - startTime.current) / 1000)
      sendBeacon('/api/tracking/update', {
        visitId: visitId.current,
        timeOnPage,
        scrollDepth: maxScroll.current,
      })
    }

    // Reset for new page
    startTime.current = Date.now()
    maxScroll.current = 0
    
    const sessionId = getSessionId()
    const utmParams = getUTMParams()
    const isEntry = isFirstPage.current
    isFirstPage.current = false

    // Record new page view
    fetch('/api/tracking/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        pageUrl: pathname,
        pageTitle: document.title,
        referrer: document.referrer || undefined,
        ...utmParams,
        deviceType: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        language: navigator.language,
        isEntryPage: isEntry,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.visitId) visitId.current = data.visitId
      })
      .catch(() => {})
  }, [pathname, sendBeacon])

  // Send exit data on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (visitId.current) {
        const timeOnPage = Math.round((Date.now() - startTime.current) / 1000)
        sendBeacon('/api/tracking/update', {
          visitId: visitId.current,
          timeOnPage,
          scrollDepth: maxScroll.current,
          isExitPage: true,
        })
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [sendBeacon])

  // Track CTA/phone clicks and form focus
  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname.startsWith('/technician')) return
    const sessionId = getSessionId()

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      const button = target.closest('button')

      // Phone link clicks
      if (anchor?.href?.startsWith('tel:')) {
        sendBeacon('/api/tracking/event', {
          sessionId,
          eventType: 'phone_click',
          eventTarget: anchor.href,
          pageUrl: pathname,
        })
      }

      // CTA button clicks
      if (button || anchor) {
        const el = (button || anchor) as HTMLElement
        const text = el.textContent?.trim().slice(0, 80)
        if (text && (text.toLowerCase().includes('book') || text.toLowerCase().includes('schedule') || text.toLowerCase().includes('get started') || text.toLowerCase().includes('contact'))) {
          sendBeacon('/api/tracking/event', {
            sessionId,
            eventType: 'cta_click',
            eventTarget: text,
            pageUrl: pathname,
          })
        }
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname, sendBeacon])

  return null
}
