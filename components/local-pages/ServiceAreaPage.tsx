// ============================================================================
// Service Area Landing Page Component
// Auto-generated page for each service area
// ============================================================================

import { ServiceArea, ServiceOffering, FAQ, TechnicianProfile } from '@prisma/client';
import { generateLandingPageSchema, getJsonLdScript } from '@/lib/schema/markup';
import ServiceAreaHero from '@/components/local-pages/ServiceAreaHero';
import ServiceCard from '@/components/local-pages/ServiceCard';
import FAQAccordion from '@/components/local-pages/FAQAccordion';
import TechnicianCard from '@/components/local-pages/TechnicianCard';
import CTAButton from '@/components/ui/CTAButton';
import { T } from '@/components/diversity/diversity-provider';
import InspectionServiceIntro from '@/components/inspection-service-intro';
import { LOCAL_INSPECTION_CONTENT } from '@/lib/local-inspection-content';

interface ServiceAreaPageProps {
  area: ServiceArea & {
    services: Array<{
      service: ServiceOffering;
      localPrice: number | null;
      isAvailable: boolean;
      estimatedWaitDays: number | null;
    }>;
    technicians: Array<{
      technician: TechnicianProfile;
    }>;
  };
  faqs: FAQ[];
  reviews?: {
    rating: number;
    count: number;
  };
  nearbyAreas: ServiceArea[];
}

// PSI offers no emergency service. The legacy emergency row still exists in the
// database (owner decision pending), but the template never renders it — neither
// as a card nor as a JSON-LD Service entry.
const HIDDEN_SERVICE_SLUGS = new Set(['emergency-sewer-service']);

// Truthful, use-case copy for the one real service (a sewer scope) and its real
// add-ons. The database rows still carry older invented product framing
// (disclosure packages, negotiation documentation, emergency response); the
// template owns what is actually displayed and emitted as JSON-LD.
const SERVICE_COPY_OVERRIDES: Record<
  string,
  { name?: string; shortDescription?: string; description?: string; href?: string }
> = {
  'standard-sewer-inspection': {
    description:
      'A comprehensive sewer line inspection using professional HD camera equipment. Our inspector inserts a high-resolution camera into your sewer line to identify cracks, blockages, root intrusion, and other issues. You receive a detailed video report and written summary of findings.',
  },
  'sewer-inspection-crawl-space': {
    shortDescription:
      "Crawl-space access available (+$30) when there's no exterior cleanout.",
  },
  'pre-sale-sewer-inspection': {
    shortDescription:
      'Selling? A pre-listing scope documents visible conditions before negotiations begin.',
  },
  'buyers-sewer-inspection': {
    shortDescription:
      'Buying? An inspection-window scope with footage you can negotiate from.',
  },
  'sewer-line-locating': {
    shortDescription:
      'Private utility locating — electronic line tracing and depth measurement.',
    href: '/locating',
  },
  'commercial-sewer-inspection': {
    shortDescription:
      'Commercial & multi-family sewer inspections for businesses, property managers, and investors.',
  },
};

export default function ServiceAreaPage({
  area,
  faqs,
  reviews,
  nearbyAreas,
}: ServiceAreaPageProps) {
  // Filter hidden services and apply copy overrides once, so the rendered cards
  // and the JSON-LD schema always describe the same, truthful offering.
  const displayServices = area.services
    .filter(({ service }) => !HIDDEN_SERVICE_SLUGS.has(service.slug))
    .map((entry) => {
      const override = SERVICE_COPY_OVERRIDES[entry.service.slug];
      if (!override) return { ...entry, hrefOverride: undefined as string | undefined };
      return {
        ...entry,
        service: {
          ...entry.service,
          name: override.name ?? entry.service.name,
          shortDescription:
            override.shortDescription ?? entry.service.shortDescription,
          description: override.description ?? override.shortDescription ?? entry.service.description,
          // Overridden cards drop the legacy DB feature lists, which reference
          // invented product contents (disclosure packages, repair estimates).
          features: override.shortDescription ? [] : entry.service.features,
        },
        hrefOverride: override.href,
      };
    });

  // Generate schema markup for SEO
  const schemas = generateLandingPageSchema({
    area,
    services: displayServices.map(s => s.service),
    reviews,
    faqs,
  });

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': schemas,
  };

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={getJsonLdScript(structuredData)}
      />

      <div className="min-h-screen">
        {/* Hero Section - matches homepage HeroSection styling */}
        <ServiceAreaHero
          cityName={area.name}
          state={area.state}
          description={area.description}
          phone={process.env.NEXT_PUBLIC_PHONE || '3176203858'}
        />

        {/* Trust Signals */}
        <section className="py-8 bg-gray-50 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><T>Fully Insured</T></span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><T>One-Business-Day Reports</T></span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><T>Detailed Reports</T></span>
              </div>
              {reviews && (
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span>{reviews.rating.toFixed(1)} ({reviews.count} <T>reviews</T>)</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {LOCAL_INSPECTION_CONTENT[area.slug] && <section className="py-12 bg-white"><div className="max-w-4xl mx-auto px-4"><h2 className="text-3xl font-bold mb-5">{LOCAL_INSPECTION_CONTENT[area.slug].title}</h2><p className="text-lg text-gray-700 mb-4">{LOCAL_INSPECTION_CONTENT[area.slug].intro}</p><p className="text-lg text-gray-700">{LOCAL_INSPECTION_CONTENT[area.slug].preparation}</p><p className="mt-5 font-medium">We confirm the exact address, available access and appointment before scheduling.</p></div></section>}
        <InspectionServiceIntro />

        {/* Services Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                <T>Sewer Inspection Services in</T> {area.name}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                <T>Choose the inspection service that fits your needs. All inspections include a detailed video report.</T>
              </p>
            </div>

            {displayServices.length === 0 && <p className="text-center"><a href="/services" className="text-primary-700 underline"><T>Explore inspection services and pricing</T></a></p>}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {displayServices.map(({ service, localPrice, isAvailable, estimatedWaitDays, hrefOverride }) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  localPrice={localPrice}
                  isAvailable={isAvailable}
                  estimatedWaitDays={estimatedWaitDays}
                  areaSlug={area.slug}
                  hrefOverride={hrefOverride}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
                <T>Why Choose</T> Precision Sewer Inspections <T>in</T> {area.name}?
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2"><T>HD Camera Technology</T></h3>
                    <p className="text-gray-600"><T>HD footage documents visible conditions. Water, debris, bends and access can limit what the camera shows.</T></p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2"><T>Written Documentation</T></h3>
                    <p className="text-gray-600"><T>Complete inspection reports with video recording for your records.</T></p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2"><T>Address-Level Availability</T></h3>
                    <p className="text-gray-600"><T>Share your address and deadline. We confirm a suitable appointment and access before scheduling.</T></p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2"><T>Upfront Pricing</T></h3>
                    <p className="text-gray-600"><T>Know your cost before we start. No surprises, no hidden fees.</T></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technicians Section */}
        {area.technicians.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  <T>Meet Your</T> {area.name} <T>Inspection Team</T>
                </h2>
                <p className="text-lg text-gray-600">
                  <T>Our inspector serves</T> {area.name} <T>and surrounding communities.</T>
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {area.technicians.map(({ technician }) => (
                  <TechnicianCard
                    key={technician.id}
                    technician={technician}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    <T>Frequently Asked Questions</T>
                  </h2>
                  <p className="text-lg text-gray-600">
                    <T>Common questions about sewer inspections in</T> {area.name}
                  </p>
                </div>

                <FAQAccordion faqs={faqs} />
              </div>
            </div>
          </section>
        )}

        {/* Nearby Areas */}
        {nearbyAreas.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                <T>Also Serving These Nearby Areas</T>
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                {nearbyAreas.map(nearby => (
                  <a
                    key={nearby.id}
                    href={`/sewer-inspection/${nearby.slug}`}
                    className="px-4 py-2 bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-700 rounded-full transition-colors"
                  >
                    {nearby.name}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 bg-primary-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <T>Ready to Schedule Your Inspection?</T>
            </h2>
            <p className="text-xl text-primary-200 mb-8 max-w-2xl mx-auto">
              <T>Share your concern and available access. We will confirm the scope and price before the inspection.</T>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CTAButton 
                href="/contact"
                variant="secondary"
                size="lg"
              >
                <T>Book Your Inspection</T>
              </CTAButton>
              <CTAButton 
                href={`tel:${process.env.NEXT_PUBLIC_PHONE || '3176203858'}`}
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-primary-900"
              >
                Call (317) 620-3858
              </CTAButton>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
