import type { ServiceArea, ServiceOffering, FAQ } from '@prisma/client'
import { COMPANY_INFO } from '@/lib/constants'
import { SITE_URL } from '@/lib/service-areas'
import { BUSINESS_ID, WEBSITE_ID, businessSchema, websiteSchema, jsonLd } from '@/lib/schema/business'

interface Review { rating: number; count: number }

export function generateOrganizationSchema() {
  return businessSchema()
}

// The company has one identity. A city landing page is not a separate office.
// PSI's own review quotes remain visible; they are not self-serving rating markup.
export function generateLocalBusinessSchema(_area: ServiceArea, _reviews?: Review) {
  return businessSchema()
}

export function generateServiceSchema(service: ServiceOffering, area?: ServiceArea) {
  const servicePage = service.slug === 'sewer-line-locating' ? '/locating' : '/services'
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}${servicePage}#${service.slug}`,
    name: service.name,
    description: service.description,
    url: `${SITE_URL}${servicePage}`,
    provider: { '@id': BUSINESS_ID },
    serviceType: service.name,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Sewer Inspection Services',
      itemListElement: [{
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: service.name },
        price: service.basePrice > 0 ? service.basePrice.toString() : undefined,
        priceCurrency: 'USD',
        priceSpecification: service.priceUnit ? {
          '@type': 'UnitPriceSpecification',
          priceType: service.priceUnit.includes('starting') ? 'https://schema.org/ListPrice' : 'https://schema.org/DRP',
          priceCurrency: 'USD',
        } : undefined,
      }],
    },
    ...(service.features?.length > 0 && {
      additionalProperty: service.features.map(value => ({ '@type': 'PropertyValue', name: 'Includes', value })),
    }),
    areaServed: area ? { '@type': 'City', name: `${area.name}, Indiana` } : 'Central Indiana',
  }
}

export function generateFAQSchema(faqs: Pick<FAQ, 'question' | 'answer'>[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
}

export function generateWebsiteSchema() {
  // No SearchAction: PSI does not expose an on-site search results interface.
  return websiteSchema()
}

export function generateWebpageSchema(options: { title: string; description: string; url: string; area?: ServiceArea }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${options.url.replace(/\/$/, '')}/#webpage`,
    url: options.url,
    name: options.title,
    description: options.description,
    inLanguage: 'en-US',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': BUSINESS_ID },
    spatialCoverage: options.area ? { '@type': 'City', name: `${options.area.name}, Indiana` } : undefined,
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.url, SITE_URL).toString(),
    })),
  }
}

export interface LandingPageSchemaOptions {
  area: ServiceArea
  services: ServiceOffering[]
  reviews?: Review
  faqs?: Pick<FAQ, 'question' | 'answer'>[]
}

export function generateLandingPageSchema({ area, services, faqs }: LandingPageSchemaOptions) {
  const schemas: object[] = [
    businessSchema(),
    websiteSchema(),
    generateWebpageSchema({
      title: `Sewer Inspection in ${area.name}, IN | ${COMPANY_INFO.name}`,
      description: area.description || `Sewer camera inspection information for ${area.name}, Indiana.`,
      url: `${SITE_URL}/sewer-inspection/${area.slug}`,
      area,
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Service Areas', url: '/areas' },
      { name: area.name, url: `/sewer-inspection/${area.slug}` },
    ]),
    ...services.map(service => generateServiceSchema(service, area)),
  ]
  if (faqs?.length) schemas.push(generateFAQSchema(faqs))
  return schemas
}

export function getJsonLdScript(schemas: object | object[]) {
  return jsonLd(schemas)
}

export function generateAllSchemas(options?: { area?: ServiceArea }) {
  const schemas: object[] = [businessSchema(), websiteSchema()]
  if (options?.area) {
    const { area } = options
    schemas.push(
      generateWebpageSchema({
        title: `Sewer Inspection in ${area.name}, IN | ${COMPANY_INFO.name}`,
        description: area.description || '',
        url: `${SITE_URL}/sewer-inspection/${area.slug}`,
        area,
      }),
      generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Service Areas', url: '/areas' },
        { name: area.name, url: `/sewer-inspection/${area.slug}` },
      ]),
    )
  }
  return schemas
}
