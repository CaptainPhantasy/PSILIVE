import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRODUCTS } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { ADD_ON_OPTIONS, AddOnId, PROMO_CODE, PROMO_PERCENT, STRIPE_PROMO_COUPON_ID, calculateCheckoutPricing, getAccessMethodForServiceType, getServiceTypeForAccessMethod, normalizeAddOns, isPromoCodeValid } from '@/lib/checkout-pricing';

type RawCheckoutBody = Record<string, unknown>;

const isString = (value: unknown): value is string => typeof value === 'string';
const sanitizeString = (value: unknown): string =>
  isString(value) ? value.trim() : '';
const isValidEmail = (value: string): boolean =>
  !!value && /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);

const isAllowedServiceType = (value: string): value is 'sewer-inspection' | 'sewer-inspection-toilet' | 'sewer-inspection-roof' => {
  return value === 'sewer-inspection' || value === 'sewer-inspection-toilet' || value === 'sewer-inspection-roof';
};

const isAllowedAccessMethod = (value: string): value is 'cleanout' | 'toilet-pull' | 'roof-vent' => {
  return value === 'cleanout' || value === 'toilet-pull' || value === 'roof-vent';
};

const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RawCheckoutBody;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return badRequest('Invalid checkout payload');
    }

    const rawServiceType = sanitizeString(body.serviceType);
    const rawAccessMethod = sanitizeString(body.accessMethod);
    const hasServiceType = rawServiceType.length > 0;
    const hasAccessMethod = rawAccessMethod.length > 0;

    if (!hasServiceType && !hasAccessMethod) {
      return badRequest('Missing service context');
    }

    if (hasServiceType && !isAllowedServiceType(rawServiceType)) {
      return badRequest('Invalid serviceType');
    }

    if (hasAccessMethod && !isAllowedAccessMethod(rawAccessMethod)) {
      return badRequest('Invalid accessMethod');
    }

    const effectiveServiceType = hasServiceType
      ? rawServiceType
      : getServiceTypeForAccessMethod(rawAccessMethod);
    const effectiveAccessMethod = getAccessMethodForServiceType(effectiveServiceType);

    const accessVerified = body.accessVerified === true;
    if (!accessVerified) {
      return badRequest('accessVerified must be true');
    }

    const {
      customerEmail,
      customerName,
      customerPhone,
      propertyAddress,
      sewerAccessMethod,
      addOns = [],
      message,
      promoCode,
      // Calendar booking info
      appointmentStart,
      appointmentEnd,
      appointmentDisplay,
      appointmentDate,
      // Structured form fields
      occupancy,
      propertyAccess,
      cleanoutLocation,
      referrerName,
      buyersAgent,
      listingAgent,
      howHeardAboutUs,
      directions,
      propertyCity,
      propertyState,
      propertyZip,
    } = body;

    const normalizedCustomerEmail = sanitizeString(customerEmail);
    const normalizedCustomerName = sanitizeString(customerName);
    const normalizedCustomerPhone = sanitizeString(customerPhone);
    const normalizedPropertyAddress = sanitizeString(propertyAddress);
    const normalizedOccupancy = sanitizeString(occupancy);
    const normalizedPropertyAccess = sanitizeString(propertyAccess);
    const normalizedCleanoutLocation = sanitizeString(cleanoutLocation);
    const normalizedReferrerName = sanitizeString(referrerName);
    const normalizedBuyersAgent = sanitizeString(buyersAgent);
    const normalizedListingAgent = sanitizeString(listingAgent);
    const normalizedHowHeardAboutUs = sanitizeString(howHeardAboutUs);
    const normalizedDirections = sanitizeString(directions);
    const normalizedPropertyCity = sanitizeString(propertyCity);
    const normalizedPropertyState = sanitizeString(propertyState);
    const normalizedPropertyZip = sanitizeString(propertyZip);
    const normalizedAppointmentStart = sanitizeString(appointmentStart);
    const normalizedAppointmentEnd = sanitizeString(appointmentEnd);
    const normalizedAppointmentDisplay = sanitizeString(appointmentDisplay);
    const normalizedAppointmentDate = sanitizeString(appointmentDate);
    const normalizedSewerAccessMethod = sanitizeString(sewerAccessMethod);

    if (!normalizedCustomerName) {
      return badRequest('customerName is required');
    }
    if (!isValidEmail(normalizedCustomerEmail)) {
      return badRequest('Valid customerEmail is required');
    }
    if (!normalizedPropertyAddress) {
      return badRequest('propertyAddress is required');
    }
    if (!normalizedOccupancy) {
      return badRequest('occupancy is required');
    }
    if (!normalizedPropertyAccess) {
      return badRequest('propertyAccess is required');
    }
    if (!normalizedCleanoutLocation) {
      return badRequest('cleanoutLocation is required');
    }
    if (!normalizedAppointmentStart || !normalizedAppointmentEnd || !normalizedAppointmentDisplay || !normalizedAppointmentDate) {
      return badRequest('appointment details are required');
    }
    if (!normalizedPropertyCity) {
      return badRequest('propertyCity is required');
    }

    const selectedAddOns = normalizeAddOns(addOns);

    // Build line items based on normalized selections.
    const lineItems: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
      quantity: number;
    }> = [];

    // Base inspection
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: STRIPE_PRODUCTS.STANDARD_INSPECTION.name,
          description: STRIPE_PRODUCTS.STANDARD_INSPECTION.description,
        },
        unit_amount: STRIPE_PRODUCTS.STANDARD_INSPECTION.amount,
      },
      quantity: 1,
    });

    // Add access method fees
    if (effectiveAccessMethod === 'roof-vent') {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: STRIPE_PRODUCTS.ROOF_VENT_ACCESS.name,
            description: STRIPE_PRODUCTS.ROOF_VENT_ACCESS.description,
          },
          unit_amount: STRIPE_PRODUCTS.ROOF_VENT_ACCESS.amount,
        },
        quantity: 1,
      });
    } else if (effectiveAccessMethod === 'toilet-pull') {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: STRIPE_PRODUCTS.TOILET_PULL.name,
            description: STRIPE_PRODUCTS.TOILET_PULL.description,
          },
          unit_amount: STRIPE_PRODUCTS.TOILET_PULL.amount,
        },
        quantity: 1,
      });
    }

    // Add-ons
    const addOnProductById: Record<AddOnId, typeof STRIPE_PRODUCTS.SAME_DAY_DELIVERY> = {
      'same-day': STRIPE_PRODUCTS.SAME_DAY_DELIVERY,
      'crawl-space': STRIPE_PRODUCTS.CRAWL_SPACE,
      'cleanout-cap': STRIPE_PRODUCTS.CLEANOUT_CAP,
      'additional-cleanout': STRIPE_PRODUCTS.ADDITIONAL_CLEANOUT,
    };

    for (const addOn of ADD_ON_OPTIONS) {
      if (!selectedAddOns.includes(addOn.id)) continue;
      const product = addOnProductById[addOn.id];
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.amount,
        },
        quantity: 1,
      });
    }

    // Apply promo discount if valid. Validate from the promo code only; never trust
    // client-supplied discount amounts as proof a discount should apply.
    const normalizedPromoCode = sanitizeString(promoCode);
    const hasValidPromo = isPromoCodeValid(normalizedPromoCode);
    const checkoutPricing = calculateCheckoutPricing(effectiveServiceType, selectedAddOns, normalizedPromoCode);
    
    // Get origin for redirect URLs
    const origin = request.headers.get('origin') || 'https://precisionsewerinspections.com';
    const stripeCustomerEmail = normalizedCustomerEmail || undefined;
    const messageText = sanitizeString(message);

    // Create or get the SAVE10 coupon for 10% off
    let discounts: Array<{ coupon: string }> = [];

    if (hasValidPromo) {
      try {
        // Try to retrieve existing coupon
        await stripe.coupons.retrieve(STRIPE_PROMO_COUPON_ID);
      } catch {
        // Coupon doesn't exist, create it
        await stripe.coupons.create({
          id: STRIPE_PROMO_COUPON_ID,
          name: '10% Off First Inspection',
          percent_off: PROMO_PERCENT,
          duration: 'once',
        });
      }
      discounts = [{ coupon: STRIPE_PROMO_COUPON_ID }];
    }

    // Save full form data to database BEFORE Stripe redirect
    // This ensures no data is lost even if the customer abandons checkout
    let submissionId = '';
    try {
      const submission = await prisma.contactSubmission.create({
        data: {
          name: normalizedCustomerName,
          email: normalizedCustomerEmail,
          phone: normalizedCustomerPhone || null,
          serviceType: effectiveServiceType,
          source: 'stripe-booking',
          message: messageText.slice(0, 2000),
          status: 'pending-payment',
          propertyAddress: normalizedPropertyAddress,
          propertyCity: normalizedPropertyCity || null,
          propertyState: normalizedPropertyState || null,
          propertyZip: normalizedPropertyZip || null,
          occupancy: normalizedOccupancy || null,
          propertyAccess: normalizedPropertyAccess || null,
          cleanoutLocation: normalizedCleanoutLocation || null,
          referrerName: normalizedReferrerName || null,
          buyersAgent: normalizedBuyersAgent || null,
          listingAgent: normalizedListingAgent || null,
          howHeardAboutUs: normalizedHowHeardAboutUs || null,
          directions: normalizedDirections || null,
          appointmentDate: normalizedAppointmentDate || null,
          appointmentTime: normalizedAppointmentDisplay || null,
          promoCode: hasValidPromo ? PROMO_CODE : null,
        },
      });
      submissionId = submission.id;
    } catch (dbError) {
      console.error('Error pre-saving booking data:', dbError);
      // Continue with checkout even if pre-save fails
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      discounts: discounts.length > 0 ? discounts : undefined,
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/contact`,
      customer_email: stripeCustomerEmail,
      metadata: {
        accessVerified: 'true',
        customerName: normalizedCustomerName,
        customerPhone: normalizedCustomerPhone,
        propertyAddress: normalizedPropertyAddress,
        accessMethod: effectiveAccessMethod,
        sewerAccessMethod: normalizedSewerAccessMethod,
        addOns: selectedAddOns.join(','),
        promoCode: hasValidPromo ? PROMO_CODE : '',
        message: messageText.slice(0, 500),
        // Calendar booking info
        appointmentStart: normalizedAppointmentStart,
        appointmentEnd: normalizedAppointmentEnd,
        appointmentDisplay: normalizedAppointmentDisplay,
        appointmentDate: normalizedAppointmentDate,
        serviceType: effectiveServiceType,
        submissionId: submissionId || '',
        subtotalCents: String(checkoutPricing.subtotalCents),
        discountCents: String(checkoutPricing.discountCents),
      },
      payment_intent_data: {
        receipt_email: stripeCustomerEmail,
        metadata: {
          accessVerified: 'true',
          customerName: normalizedCustomerName,
          customerPhone: normalizedCustomerPhone,
          propertyAddress: normalizedPropertyAddress,
          promoCode: hasValidPromo ? PROMO_CODE : '',
          addOns: selectedAddOns.join(','),
          appointmentStart: normalizedAppointmentStart,
          appointmentEnd: normalizedAppointmentEnd,
          appointmentDisplay: normalizedAppointmentDisplay,
          appointmentDate: normalizedAppointmentDate,
        },
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
