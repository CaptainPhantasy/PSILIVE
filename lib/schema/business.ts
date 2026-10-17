import { COMPANY_INFO } from '@/lib/constants'
import { SITE_URL, SERVICE_AREA_LINKS } from '@/lib/service-areas'

export const BUSINESS_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

/** One company identity; a service-area page does not create another branch. */
export function businessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': BUSINESS_ID,
    name: COMPANY_INFO.name,
    description: 'Sewer camera inspections in Central Indiana with recorded video, written findings and inspection limitations explained.',
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
