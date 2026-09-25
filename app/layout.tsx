import type { Metadata } from 'next'
import './globals.css'
import './psi-website.css'
import { Toaster } from 'react-hot-toast'
import GoogleAnalytics from '@/components/google-analytics'
import SiteTracker from '@/components/site-tracker'
import DiversityHeadScript from '@/components/diversity/diversity-head-script'
import DiversityGate from '@/components/diversity/diversity-gate'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://precisionsewerinspections.com'
  
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: 'Sewer Scope Indianapolis from $159 | Precision Sewer',
      template: '%s | Precision Sewer',
    },
    description: 'Central Indiana sewer inspections from $159 with HD video and clear written findings. Optional cleaning and service through sister company Indiana Drain Company.',
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
      title: 'Sewer Scope Indianapolis from $159 | Precision Sewer',
      description: "See what's really in your pipes. HD video sewer inspection with one-business-day delivery. InterNACHI member. Central Indiana.",
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Precision Sewer Inspections - Central Indiana Sewer Scope Experts',
        },
      ],
      type: 'website',
      locale: 'en_US',
      siteName: 'Precision Sewer Inspections',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Indianapolis Sewer Scope from $159 | Precision Sewer',
      description: "Central Indiana's trusted sewer inspection. InterNACHI member, one-business-day HD reports.",
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
      canonical: 'https://precisionsewerinspections.com',
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
