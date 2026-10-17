import { SERVICE_OPTIONS } from '@/lib/checkout-pricing'
import { IDC_URL, RELATIONSHIP_DISCLOSURE } from '@/lib/inspection-and-service'
import { COMPANY_INFO } from '@/lib/constants'
import { SITE_URL, SERVICE_AREA_LINKS } from '@/lib/service-areas'

export const BUSINESS_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

export function inspectionOffers() {
  return SERVICE_OPTIONS.map(option => ({
    '@type': 'Offer',
    name: option.label,
    description: `${option.description}. HD video recording, written findings, one-business-day delivery and phone consultation. Optional add-ons are priced separately.`,
    price: (option.amountCents / 100).toFixed(2),
    priceCurrency: 'USD',
    url: `${SITE_URL}/contact`,
    seller: { '@id': BUSINESS_ID },
    itemOffered: { '@type': 'Service', name: option.label, serviceType: 'Sewer Camera Inspection' },
  }))
}

/** One company identity; a service-area page does not create another branch. */
export function businessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': BUSINESS_ID,
    name: COMPANY_INFO.name,
    description: `Residential and commercial drain and sewer inspections, accessible household and pool pump inspections, recorded video, written findings and separately approved hydro jetting in Central Indiana. ${RELATIONSHIP_DISCLOSURE}`,
    priceRange: `From $${SERVICE_OPTIONS[0].amountCents / 100}`,
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'PSI Sewer Inspection Packages', itemListElement: inspectionOffers() },
    subjectOf: {
      '@type': 'WebPage',
      url: `${SITE_URL}/inspection-and-service`,
      name: 'PSI Inspections and Indiana Drain Company Services',
      description: RELATIONSHIP_DISCLOSURE,
      about: [
        { '@id': BUSINESS_ID },
        { '@type': 'Organization', name: 'Indiana Drain Company', url: IDC_URL, description: 'Sister company under shared ownership; optional drain cleaning, hydro jetting, pump and basin cleaning, maintenance and qualifying repair services. Separately scoped, priced and authorized.' },
      ],
    },
    url: SITE_URL,
    telephone: `+1${COMPANY_INFO.phoneRaw}`,
    email: COMPANY_INFO.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: COMPANY_INFO.city,
      addressRegion: COMPANY_INFO.state,
      addressCountry: 'US',
    },
    areaServed: SERVICE_AREA_LINKS.map(({ name }) => ({ '@type': 'City', name: `${name}, Indiana` })),
    image: `${SITE_URL}/og-image.png`,
    logo: `${SITE_URL}/logo.png`,
    sameAs: ['https://www.bbb.org/us/in/indianapolis/profile/sewer-inspection/precision-sewer-inspection-llc-0382-90068319'],
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: COMPANY_INFO.name,
    alternateName: 'PSI',
    url: SITE_URL,
    publisher: { '@id': BUSINESS_ID },
    inLanguage: 'en-US',
  }
}

export function jsonLd(data: object | object[]) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') }
}
