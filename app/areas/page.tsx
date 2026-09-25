// ============================================================================
// Service Areas Index Page
// Lists all service areas
// ============================================================================

import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import Header from '@/components/header';
import Footer from '@/components/footer';
import AIChat from '@/components/ai-chat';
import StructuredData from '@/components/structured-data';
import { generateAllSchemas, getJsonLdScript } from '@/lib/schema/markup';
import { withDatabaseFallback } from '@/lib/prisma-timeout';
import { SERVICE_AREA_LINKS } from '@/lib/service-areas';
import { LOCAL_INSPECTION_CONTENT } from '@/lib/local-inspection-content';
import { T } from '@/components/diversity/diversity-provider';

const prisma = new PrismaClient();

export const metadata = {
  title: 'Service Areas | Precision Sewer Inspections',
  description: 'Professional sewer inspection services throughout the Indianapolis metro area. Serving Indianapolis, Carmel, Fishers, Noblesville, Greenwood, and surrounding communities.',
};

const fallbackAreaSeeds = [
  { id: 'indianapolis-in', name: 'Indianapolis', state: 'IN', slug: 'indianapolis-in', description: 'Professional sewer inspection services throughout Indianapolis and Marion County.', zipCodes: ['46201', '46202', '46203'] },
  { id: 'carmel-in', name: 'Carmel', state: 'IN', slug: 'carmel-in', description: 'Professional sewer inspection services for Carmel homeowners, buyers, and real estate professionals.', zipCodes: ['46032', '46033', '46074'] },
  { id: 'fishers-in', name: 'Fishers', state: 'IN', slug: 'fishers-in', description: 'Professional sewer camera inspections for Fishers and northeast Indianapolis suburbs.', zipCodes: ['46037', '46038', '46040'] },
  { id: 'noblesville-in', name: 'Noblesville', state: 'IN', slug: 'noblesville-in', description: 'Professional sewer inspection services in Noblesville and surrounding Hamilton County communities.', zipCodes: ['46060', '46062'] },
  { id: 'greenwood-in', name: 'Greenwood', state: 'IN', slug: 'greenwood-in', description: 'Professional sewer scope inspections for Greenwood and Johnson County properties.', zipCodes: ['46142', '46143'] },
  { id: 'westfield-in', name: 'Westfield', state: 'IN', slug: 'westfield-in', description: 'Professional sewer inspection services for Westfield homes and real estate transactions.', zipCodes: ['46074'] },
];

const fallbackAreas = SERVICE_AREA_LINKS.map(({ name, slug }) => ({
  id: slug, name, slug, state: 'IN', zipCodes: [],
  description: LOCAL_INSPECTION_CONTENT[slug]?.title ?? 'Confirm your address and inspection scope with PSI.',
  city: name,
  geoBounds: null,
  population: null,
  isActive: true,
  priority: 0,
  localKeywords: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}));


export default async function ServiceAreasPage() {
  const areas = await withDatabaseFallback(
    prisma.serviceArea.findMany({
      where: { isActive: true },
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' },
      ],
    }),
    fallbackAreas,
  );

  const schemas = generateAllSchemas();
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': schemas,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData type="LocalBusiness" />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 to-primary-700 text-white py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <T>Service Areas</T>
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              <T>Professional sewer inspection services throughout the Indianapolis metro area and surrounding communities.</T>
            </p>
          </div>
        </section>

        {/* Areas Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {areas.map((area) => (
                <Link
                  key={area.id}
                  href={`/sewer-inspection/${area.slug}`}
                  className="group block bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg hover:border-primary-200 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {area.name}, {area.state}
                      </h2>
                      <p className="text-gray-600 text-sm mt-2">
                        {area.description
                          ? area.description.substring(0, 100)
                          : <T>Professional sewer inspection services</T>}
                        {(area.description?.length || 0) > 100 ? '...' : ''}
                      </p>
                    </div>
                    <svg
                      className="w-6 h-6 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {area.zipCodes?.slice(0, 3).map((zip) => (
                      <span key={zip} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {zip}
                      </span>
                    ))}
                    {(area.zipCodes?.length || 0) > 3 && (
                      <span className="text-xs text-gray-500">
                        +{area.zipCodes!.length - 3} <T>more</T>
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              <T>Don't See Your Area?</T>
            </h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              <T>We serve most of central Indiana. Contact us to check if we cover your location.</T>
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <T>Contact Us</T>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <AIChat />
    </div>
  );
}
