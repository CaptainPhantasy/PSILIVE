import { COMPANY_INFO, FAQ_ITEMS, SERVICE_AREAS } from '@/lib/constants'

interface StructuredDataProps {
  type: 'LocalBusiness' | 'Service' | 'FAQPage' | 'WebPage' | 'BreadcrumbList'
  pageTitle?: string
  pageDescription?: string
  breadcrumbs?: { name: string; url: string }[]
  /**
   * The exact FAQ items rendered on the page. FAQPage structured data must
   * describe only what the page actually shows, so callers pass their rendered
   * list; defaults to the full homepage set for backwards compatibility.
   */
  faqs?: { question: string; answer: string }[]
}

export default function StructuredData({ type, pageTitle, pageDescription, breadcrumbs, faqs }: StructuredDataProps) {
  const baseUrl = 'https://precisionsewerinspections.com'

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}/#organization`,
    name: COMPANY_INFO.name,
    description: 'HD video sewer scope inspections, one-business-day report delivery, performed by an InterNACHI-member inspector to InterNACHI\'s published Sewer Scope Standards of Practice.',
    url: baseUrl,
    telephone: COMPANY_INFO.phone,
    email: COMPANY_INFO.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Indianapolis',
      addressRegion: 'IN',
      addressCountry: 'US',
    },
    areaServed: SERVICE_AREAS.map((area) => ({
      '@type': 'City',
      name: `${area}, Indiana`,
    })),
    priceRange: 'From $159',
    image: `${baseUrl}/logo.png`,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      'https://www.bbb.org/us/in/indianapolis/profile/sewer-inspection/precision-sewer-inspection-llc-0382-90068319',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Sewer Inspection Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Standard Sewer Scope Inspection',
            description: 'HD video inspection of your main sewer line with premium written report delivered within one business day.',
          },
          price: '159.00',
          priceCurrency: 'USD',
        },
      ],
    },
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Sewer Scope Inspection',
    provider: {
      '@type': 'LocalBusiness',
      name: COMPANY_INFO.name,
      telephone: COMPANY_INFO.phone,
    },
    additionalType: [
      'sewer camera inspection',
      'sanitary lateral camera inspection',
      'pre-purchase sewer scope',
      'non-invasive sewer line inspection',
    ],
    areaServed: SERVICE_AREAS.map((area) => ({
      '@type': 'City',
      name: `${area}, Indiana`,
    })),
    description: 'Evidence-based sewer camera surveys for home buyers, homeowners, and real estate professionals in Central Indiana. InterNACHI-member inspector, HD footage, premium reporting with transparent pricing.',
    offers: {
      '@type': 'Offer',
      price: '159',
      priceCurrency: 'USD',
    },
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (faqs ?? FAQ_ITEMS).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle || COMPANY_INFO.name,
    description: pageDescription || 'Professional sewer scope inspections in Central Indiana.',
    url: baseUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: COMPANY_INFO.name,
      url: baseUrl,
    },
  }

  const breadcrumbSchema = breadcrumbs
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      }
    : null

  const getSchema = () => {
    switch (type) {
      case 'LocalBusiness':
        return localBusinessSchema
      case 'Service':
        return serviceSchema
      case 'FAQPage':
        return faqSchema
      case 'WebPage':
        return webPageSchema
      case 'BreadcrumbList':
        return breadcrumbSchema
      default:
        return localBusinessSchema
    }
  }

  const schema = getSchema()
  if (!schema) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
