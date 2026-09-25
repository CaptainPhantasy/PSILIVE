import Stripe from 'stripe';
import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as const as '2026-02-25.clover',
});

// Client-side Stripe promise (singleton pattern)
let stripePromise: Promise<StripeClient | null>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Product/Price IDs - will be populated after creating products
export const STRIPE_PRODUCTS = {
  STANDARD_INSPECTION: {
    name: 'Standard Sewer Inspection',
    description: 'HD video inspection with written report delivered within one business day',
    priceId: process.env.STRIPE_PRICE_STANDARD || '',
    amount: 15900, // $159.00 in cents
  },
  ADDITIONAL_UNIT: {
    name: 'Additional Unit Inspection',
    description: 'Additional unit inspection for multi-family properties',
    priceId: process.env.STRIPE_PRICE_ADDITIONAL_UNIT || '',
    amount: 12900, // $129.00 in cents
  },
  SAME_DAY_DELIVERY: {
    name: 'Same-Day Report Delivery',
    description: 'Expedited report delivery on the same day',
    priceId: process.env.STRIPE_PRICE_SAME_DAY || '',
    amount: 3900, // $39.00 in cents
  },
  ROOF_VENT_ACCESS: {
    name: 'Roof Vent Access',
    description: 'Camera entry via plumbing vent on roof',
    priceId: process.env.STRIPE_PRICE_ROOF_VENT || '',
    amount: 5000, // $50.00 in cents
  },
  TOILET_PULL: {
    name: 'Toilet Pull & Reset',
    description: 'Includes new wax ring and supply line',
    priceId: process.env.STRIPE_PRICE_TOILET_PULL || '',
    amount: 6500, // $65.00 in cents
  },
  CRAWL_SPACE: {
    name: 'Crawl Space Access',
    description: 'Additional fee for crawl space entry',
    priceId: process.env.STRIPE_PRICE_CRAWL_SPACE || '',
    amount: 3000, // $30.00 in cents
  },
  CLEANOUT_CAP: {
    name: 'Clean-Out Cap Replacement',
    description: 'Cut out and replace damaged or inaccessible cleanout cap',
    priceId: process.env.STRIPE_PRICE_CLEANOUT_CAP || '',
    amount: 5000, // $50.00 in cents
  },
  ADDITIONAL_CLEANOUT: {
    name: 'Additional Cleanout Inspection',
    description: 'Additional cleanout inspection on same visit',
    priceId: process.env.STRIPE_PRICE_ADDITIONAL_CLEANOUT || '',
    amount: 12900, // $129.00 in cents
  },
};
