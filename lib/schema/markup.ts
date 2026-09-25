// ============================================================================
// Schema.org JSON-LD Markup Generator
// Makes your pages readable by Google, ChatGPT, and other AI
// ============================================================================

import { ServiceArea, ServiceOffering, FAQ } from '@prisma/client';

// Company constants (update these)
const COMPANY = {
  name: 'Precision Sewer Inspections',
  description: 'Professional sewer and drain camera inspection services for homeowners, realtors, and property managers throughout the Indianapolis metro area.',
  url: 'https://precisionsewerinspections.com',
  phone: '(317) 620-3858',
  phoneRaw: '3176203858',
  email: 'booking@precisionsewerinspections.com',
  address: {
    streetAddress: '6405 Justins Ridge Road',
    city: 'Nashville',
    state: 'IN',
    postalCode: '47448',
    country: 'US'
  },
  coordinates: {
    latitude: 39.2072,
    longitude: -86.4175
  },
  hours: [
    { day: 'Monday', opens: '08:00', closes: '18:00' },
    { day: 'Tuesday', opens: '08:00', closes: '18:00' },
    { day: 'Wednesday', opens: '08:00', closes: '18:00' },
    { day: 'Thursday', opens: '08:00', closes: '18:00' },
    { day: 'Friday', opens: '08:00', closes: '18:00' },
    { day: 'Saturday', opens: '09:00', closes: '16:00' },
    // Sunday closed
  ],
  socialProfiles: {
    facebook: 'https://facebook.com/precisionsewerinspections',
    yelp: 'https://yelp.com/biz/precision-sewer-inspections',
  },
  logo: 'https://precisionsewerinspections.com/logo.png',
  image: 'https://precisionsewerinspections.com/og-image.png',
  priceRange: '$$',
  areaServed: 'Indianapolis Metropolitan Area',
  serviceType: 'Sewer Inspection',
  naics: '541350',
  sameAs: [] as string[],
};

interface Review {
  rating: number;
  count: number;
}

// ============================================================================
// ORGANIZATION SCHEMA - The foundation for all other schemas
// ============================================================================

export function generateOrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${COMPANY.url}/#organization`,
    name: COMPANY.name,
    description: COMPANY.description,
    url: COMPANY.url,
    logo: COMPANY.logo,
    image: COMPANY.image,
    telephone: COMPANY.phone,
    email: COMPANY.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Indianapolis',
      addressRegion: 'IN',
      addressCountry: COMPANY.address.country,
    },
    priceRange: COMPANY.priceRange,
    areaServed: COMPANY.areaServed,
    sameAs: ['https://www.bbb.org/us/in/indianapolis/profile/sewer-inspection/precision-sewer-inspection-llc-0382-90068319'],
  };

  return schema;
}

// ============================================================================
// LOCAL BUSINESS SCHEMA - For service area pages
// ============================================================================

export function generateLocalBusinessSchema(
  area: ServiceArea,
  reviews?: Review
) {
  const areaKeywords = area.localKeywords?.join(', ') || area.name;
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${COMPANY.url}/sewer-inspection/${area.slug}/#localbusiness`,
    name: COMPANY.name,
    description: area.description || `${COMPANY.name} provides professional sewer inspection services in ${area.name}, Indiana.`,
    url: `${COMPANY.url}/sewer-inspection/${area.slug}`,
    telephone: COMPANY.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Indianapolis',
      addressRegion: 'IN',
      addressCountry: 'US',
    },
    areaServed: {
      '@type': 'City',
      name: area.name,
    },
    priceRange: COMPANY.priceRange,
    image: COMPANY.image,
    logo: COMPANY.logo,
    aggregateRating: reviews ? {
      '@type': 'AggregateRating',
      ratingValue: reviews.rating.toString(),
      reviewCount: reviews.count.toString(),
    } : undefined,
    sameAs: ['https://www.bbb.org/us/in/indianapolis/profile/sewer-inspection/precision-sewer-inspection-llc-0382-90068319'],
  };

  return schema;
}

// ============================================================================
// SERVICE SCHEMA - For individual service offerings
// ============================================================================

export function generateServiceSchema(
  service: ServiceOffering,
  area?: ServiceArea
) {
  // @id and url must resolve to real pages. Individual /services/{slug} URLs
  // do not exist (they 404), so every service anchors to the /services page;
  // commercial uses the canonical #commercial anchor.
  const serviceAnchor = service.slug === 'commercial-sewer-inspection'
    ? `${COMPANY.url}/services#commercial`
    : `${COMPANY.url}/services#${service.slug}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': serviceAnchor,
    name: service.name,
    description: service.description,
    url: area 
      ? `${COMPANY.url}/sewer-inspection/${area.slug}/#${service.slug}`
      : `${COMPANY.url}/services`,
    provider: {
      '@id': `${COMPANY.url}/#organization`,
    },
    serviceType: service.name,
    areaServed: area ? {
      '@type': 'City',
      name: area.name,
    } : COMPANY.areaServed,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Sewer Inspection Services',
      itemListElement: [{
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service.name,
        },
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
      additionalProperty: service.features.map(f => ({
        '@type': 'PropertyValue',
        name: 'Includes',
        value: f,
      })),
    }),
  };

  return schema;
}

// ============================================================================
// FAQ SCHEMA - For FAQ pages (helps show in Google results)
// ============================================================================

export function generateFAQSchema(faqs: Pick<FAQ, 'question' | 'answer'>[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// ============================================================================
// WEBSITE SCHEMA - For the main site
// ============================================================================

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${COMPANY.url}/#website`,
    url: COMPANY.url,
    name: COMPANY.name,
    description: COMPANY.description,
    publisher: {
      '@id': `${COMPANY.url}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${COMPANY.url}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ============================================================================
// WEBPAGE SCHEMA - For individual pages
// ============================================================================

export function generateWebpageSchema(options: {
  title: string;
  description: string;
  url: string;
  area?: ServiceArea;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${options.url}/#webpage`,
    url: options.url,
    name: options.title,
    description: options.description,
    isPartOf: {
      '@id': `${COMPANY.url}/#website`,
    },
    about: options.area ? {
      '@type': 'City',
      name: options.area.name,
    } : undefined,
  };
}

// ============================================================================
// BREADCRUMB SCHEMA - For navigation structure
// ============================================================================

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${COMPANY.url}${item.url}`,
    })),
  };
}

// ============================================================================
// LOCAL LANDING PAGE SCHEMA - Combined schema for area pages
// ============================================================================

export interface LandingPageSchemaOptions {
  area: ServiceArea;
  services: ServiceOffering[];
  reviews?: Review;
  faqs?: Pick<FAQ, 'question' | 'answer'>[];
}

export function generateLandingPageSchema(options: LandingPageSchemaOptions) {
  const { area, services, reviews, faqs } = options;

  const schemas: object[] = [
    generateLocalBusinessSchema(area, reviews),
    generateWebpageSchema({
      title: `Sewer Inspection in ${area.name}, IN | ${COMPANY.name}`,
      description: area.description || `Professional sewer camera inspection services in ${area.name}, Indiana. Serving homeowners, realtors, and property managers.`,
      url: `${COMPANY.url}/sewer-inspection/${area.slug}`,
      area,
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Service Areas', url: '/areas' },
      { name: area.name, url: `/sewer-inspection/${area.slug}` },
    ]),
  ];

  // Add service schemas
  services.forEach(service => {
    schemas.push(generateServiceSchema(service, area));
  });

  // Add FAQ schema if available
  if (faqs && faqs.length > 0) {
    schemas.push(generateFAQSchema(faqs));
  }

  return schemas;
}

// ============================================================================
// JSON-LD COMPONENT FOR REACT
// ============================================================================

export function getJsonLdScript(schemas: object | object[]) {
  const schemaArray = Array.isArray(schemas) ? schemas : [schemas];
  return {
    __html: JSON.stringify(schemaArray),
  };
}

// ============================================================================
// GENERATE ALL SCHEMAS FOR A PAGE
// ============================================================================

export function generateAllSchemas(options?: { area?: ServiceArea }) {
  const schemas: object[] = [
    generateOrganizationSchema(),
    generateWebsiteSchema(),
  ];

  if (options?.area) {
    schemas.push(
      generateLocalBusinessSchema(options.area),
      generateWebpageSchema({
        title: `Sewer Inspection in ${options.area.name}, IN | ${COMPANY.name}`,
        description: options.area.description || '',
        url: `${COMPANY.url}/sewer-inspection/${options.area.slug}`,
        area: options.area,
      }),
      generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Service Areas', url: '/areas' },
        { name: options.area.name, url: `/sewer-inspection/${options.area.slug}` },
      ])
    );
  }

  return schemas;
}
