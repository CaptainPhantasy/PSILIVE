// ============================================================================
// Service Card Component
// Displays individual service offerings
// ============================================================================

import { ServiceOffering } from '@prisma/client';
import CTAButton from '@/components/ui/CTAButton';

interface ServiceCardProps {
  service: ServiceOffering;
  localPrice?: number | null;
  isAvailable?: boolean;
  estimatedWaitDays?: number | null;
  areaSlug?: string;
  hrefOverride?: string;
}

export default function ServiceCard({
  service,
  localPrice,
  isAvailable = true,
  estimatedWaitDays,
  areaSlug,
  hrefOverride,
}: ServiceCardProps) {
  const displayPrice = localPrice ?? service.basePrice;
  
  const getWaitTimeText = () => {
    if (estimatedWaitDays === 0) return 'Same-day available';
    if (estimatedWaitDays === 1) return 'Next-day available';
    if (estimatedWaitDays && estimatedWaitDays > 1) return `${estimatedWaitDays} days`;
    return null;
  };

  const waitTime = getWaitTimeText();

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col ${!isAvailable ? 'opacity-75' : ''}`}>
      {service.isFeatured && (
        <div className="bg-primary-600 text-white text-center py-1 text-sm font-medium">
          Most Popular
        </div>
      )}
      
      <div className="p-6 flex flex-col flex-grow">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {service.name}
          </h3>
          <p className="text-gray-600 text-sm">
            {service.shortDescription || service.description.substring(0, 100)}
          </p>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            {service.basePrice > 0 ? (
              <>
                <span className="text-3xl font-bold text-primary-600">
                  ${displayPrice}
                </span>
                {service.priceUnit && (
                  <span className="text-gray-500 text-sm">
                    {service.priceUnit}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xl font-bold text-gray-900">
                {service.priceUnit || 'Contact for pricing'}
              </span>
            )}
          </div>
          {waitTime && (
            <p className="text-sm text-green-600 mt-1">{waitTime}</p>
          )}
        </div>

        {/* Features */}
        {service.features && service.features.length > 0 && (
          <ul className="space-y-2 mb-6 flex-grow">
            {service.features.slice(0, 5).map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
            {service.features.length > 5 && (
              <li className="text-sm text-gray-500 pl-7">
                +{service.features.length - 5} more
              </li>
            )}
          </ul>
        )}

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>~{service.avgDuration} minutes</span>
        </div>

        {/* CTA — booking form lives at /contact (there is no /book route) */}
        <CTAButton
          href={hrefOverride ?? (isAvailable ? '/contact' : '#')}
          variant={service.isFeatured ? 'primary' : 'outline'}
          className="w-full"
          disabled={!isAvailable}
        >
          {isAvailable ? 'Book Now' : 'Currently Unavailable'}
        </CTAButton>
      </div>
    </div>
  );
}
