import { COMPANY_INFO, FAQ_ITEMS } from '@/lib/constants'
import { SITE_URL, SERVICE_AREA_LINKS } from '@/lib/service-areas'
import { BUSINESS_ID, WEBSITE_ID, businessSchema, websiteSchema, jsonLd } from '@/lib/schema/business'

interface StructuredDataProps {
  type: 'LocalBusiness' | 'WebSite' | 'Service' | 'FAQPage' | 'WebPage' | 'BreadcrumbList'
  pageTitle?: string
  pageDescription?: string
  pagePath?: string
  breadcrumbs?: { name: string; url: string }[]
  /** Pass only questions and answers that this page visibly renders. */
  faqs?: { question: string; answer: string }[]
}

export default function StructuredData({ type, pageTitle, pageDescription, pagePath = '/', breadcrumbs, faqs }: StructuredDataProps) {
  const pageUrl = new URL(pagePath, SITE_URL).toString()
  let schema: object | null = null
  switch (type) {
    case 'LocalBusiness':
      schema = businessSchema()
      break
    case 'WebSite':
      schema = websiteSchema()
      break
    case 'Service':
      schema = {
        '@context': 'https://schema.org',
        '@graph': [
          businessSchema(),
          {
            '@type': 'Service',
            '@id': `${SITE_URL}/services#sewer-camera-inspection`,
            name: 'Sewer Camera Inspection',
            serviceType: 'Sewer Camera Inspection',
            url: `${SITE_URL}/services`,
            provider: { '@id': BUSINESS_ID },
            areaServed: SERVICE_AREA_LINKS.map(({ name }) => ({ '@type': 'City', name: `${name}, Indiana` })),
            description: 'Camera inspection of accessible sewer lines with recorded video, written findings and inspection limitations explained.',
          },
        ],
      }
      break
    case 'FAQPage':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: (faqs ?? FAQ_ITEMS).map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      }
      break
    case 'WebPage':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${pageUrl.replace(/\/$/, '')}/#webpage`,
        name: pageTitle || COMPANY_INFO.name,
        description: pageDescription || 'Sewer camera inspections in Central Indiana.',
        url: pageUrl,
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': BUSINESS_ID },
        inLanguage: 'en-US',
      }
      break
    case 'BreadcrumbList':
      schema = breadcrumbs ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: new URL(crumb.url, SITE_URL).toString(),
        })),
      } : null
      break
  }
  if (!schema) return null
  return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />
}
