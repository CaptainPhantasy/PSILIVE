import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/service-areas'
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/page-metadata'
import './globals.css'
import './psi-website.css'
import { Toaster } from 'react-hot-toast'
import GoogleAnalytics from '@/components/google-analytics'
import SiteTracker from '@/components/site-tracker'
import DiversityHeadScript from '@/components/diversity/diversity-head-script'
import DiversityGate from '@/components/diversity/diversity-gate'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = SITE_URL
  
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${SITE_TITLE} | Precision Sewer Inspections`,
      template: '%s | Precision Sewer Inspections',
    },
    description: SITE_DESCRIPTION,
    authors: [{ name: 'Precision Sewer Inspections' }],
    creator: 'Precision Sewer Inspections',
    publisher: 'Precision Sewer Inspections',
    formatDetection: {
      telephone: true,
      email: true,
      address: true,
    },
    icons: {
      icon: '/favicon.svg',
      shortcut: '/favicon.svg',
      apple: '/logo.png',
    },
    manifest: '/manifest.json',
    openGraph: {
      title: `${SITE_TITLE} | Precision Sewer Inspections`,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Precision Sewer Inspections',
        },
      ],
      type: 'website',
      locale: 'en_US',
      siteName: 'Precision Sewer Inspections',
      url: SITE_URL,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_TITLE} | Precision Sewer Inspections`,
      description: SITE_DESCRIPTION,
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: SITE_URL,
    },
    verification: {
      // Add these when you have them
      // google: 'your-google-verification-code',
      // bing: 'your-bing-verification-code',
    },
    category: 'Home Services',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Chatbot powered by Anthropic Claude via /api/chat */}
        {/* Applies persisted theme/locale/a11y prefs before paint (no FOUC) */}
        <DiversityHeadScript />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <DiversityGate>
          {children}
        </DiversityGate>
        <Toaster position="bottom-right" />
        <GoogleAnalytics />
        <SiteTracker />
      </body>
    </html>
  )
}
