'use client';

// ============================================================================
// FAQ Accordion Component
// Expandable FAQ items
// ============================================================================

import { useState } from 'react';
import { FAQ } from '@prisma/client';

interface FAQAccordionProps {
  faqs: FAQ[];
  categories?: boolean;
}

export default function FAQAccordion({ faqs, categories = true }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Group FAQs by category if requested
  const groupedFaqs = categories ? groupByCategory(faqs) : { 'All': faqs };

  function groupByCategory(items: FAQ[]) {
    return items.reduce((acc, faq) => {
      const category = faq.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(faq);
      return acc;
    }, {} as Record<string, FAQ[]>);
  }

  const categoryLabels: Record<string, string> = {
    GENERAL: 'General Questions',
    BOOKING: 'Booking & Scheduling',
    PRICING: 'Pricing & Payments',
    TECHNICAL: 'Technical Details',
    PROCESS: 'What to Expect',
    AFTER_SERVICE: 'After Your Inspection',
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
        <div key={category}>
          {categories && Object.keys(groupedFaqs).length > 1 && (
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {categoryLabels[category] || category}
            </h3>
          )}
          <div className="space-y-2">
            {categoryFaqs.map((faq) => (
              <div
                key={faq.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full px-4 py-4 text-left bg-white hover:bg-gray-50 flex items-center justify-between gap-4 transition-colors"
                  aria-expanded={openId === faq.id}
                >
                  <span className="font-medium text-gray-900">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                      openId === faq.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {openId === faq.id && (
                  <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
