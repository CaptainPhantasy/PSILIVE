'use client'

/**
 * DiversityGate — route boundary for the diversity / accessibility layer.
 *
 * The diversity feature (theme, locale, dyslexia, agent toolbar) is a PUBLIC
 * MARKETING-SITE concern. The admin dashboard and the technician field PWA
 * (/admin, /technician) are a separate app boundary and were never designed
 * for dark-mode repaints, the dyslexia font swap, agent-mode DOM mutation, or
 * the floating toolbar. Because they are nested layouts they would otherwise
 * inherit the diversity provider from the shared root layout.
 *
 * This gate mounts the provider + toolbar ONLY on non-backend routes, and on
 * backend routes it neutralizes any diversity artifacts that may have been
 * stamped on <html> (e.g. by leaked localStorage state on a client-side nav),
 * so the backend PWA always renders in its intended, untouched styling.
 */
import * as React from 'react'
import { usePathname } from 'next/navigation'
import { DiversityProvider } from './diversity-provider'
import DiversityToolbar from './diversity-toolbar'

/** Route prefixes that must stay outside the diversity layer. */
const BACKEND_PREFIXES = ['/admin', '/technician']

function isBackendRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return BACKEND_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export default function DiversityGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const backend = isBackendRoute(pathname)

  // Belt-and-suspenders: if we ever land on a backend route with diversity
  // attributes already on <html> (leaked state, client-side navigation), strip
  // them so the backend PWA is never repainted/restyled.
  React.useEffect(() => {
    if (!backend || typeof document === 'undefined') return
    const d = document.documentElement
    d.classList.remove('dark', 'theme-transitioning')
    d.setAttribute('data-dyslexic', 'false')
    d.setAttribute('data-agent-mode', 'false')
  }, [backend])

  if (backend) return <>{children}</>

  return (
    <DiversityProvider>
      {children}
      <DiversityToolbar />
    </DiversityProvider>
  )
}
