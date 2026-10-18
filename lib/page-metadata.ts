import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/service-areas'

export const SITE_DESCRIPTION = 'Central Indiana sewer, drain and pump inspections with clear findings. Optional cleaning, maintenance and qualifying repairs through sister company Indiana Drain Company.'
export const SITE_TITLE = 'Sewer, Drain and Pump Inspections in Central Indiana'

/** Use the production page's URL even when reviewing a separate editing copy. */
export function pageMetadata(path: string, title: string, description: string): Metadata {
  const url = new URL(path, SITE_URL).toString()
  const brandedTitle = `${title} | Precision Sewer Inspections`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: brandedTitle,
      description,
      url,
      type: 'website',
      locale: 'en_US',
      siteName: 'Precision Sewer Inspections',
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Precision Sewer Inspections' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: brandedTitle,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
  }
}
