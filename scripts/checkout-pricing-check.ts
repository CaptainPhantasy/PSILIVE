import assert from 'node:assert/strict';
import {
  calculateCheckoutPricing,
  formatCents,
  getAccessMethodForServiceType,
  getServiceTypeForAccessMethod,
  isPromoCodeValid,
  normalizeAddOns,
} from '../lib/checkout-pricing';

const standardWithPromo = calculateCheckoutPricing('sewer-inspection', [], 'SAVE10');
assert.equal(standardWithPromo.subtotalCents, 15900, 'standard inspection subtotal');
assert.equal(standardWithPromo.discountCents, 1590, 'SAVE10 applies 10% to standard inspection');
assert.equal(standardWithPromo.totalCents, 14310, 'standard inspection total after 10%');

const standardWithAddOns = calculateCheckoutPricing(
  'sewer-inspection',
  ['same-day', 'crawl-space', 'cleanout-cap', 'additional-cleanout'],
  'SAVE10',
);
assert.equal(standardWithAddOns.subtotalCents, 40700, 'standard plus all add-ons subtotal');
assert.equal(standardWithAddOns.discountCents, 4070, 'SAVE10 applies 10% to service plus add-ons');
assert.equal(standardWithAddOns.totalCents, 36630, 'standard plus all add-ons total after 10%');

const toiletPull = calculateCheckoutPricing('sewer-inspection-toilet', [], '');
assert.equal(toiletPull.subtotalCents, 22400, 'toilet pull service includes $65 access fee');
assert.equal(toiletPull.discountCents, 0, 'no blank promo discount');
assert.equal(toiletPull.totalCents, 22400, 'toilet pull total without promo');

const roofAccess = calculateCheckoutPricing('sewer-inspection-roof', [], 'save10');
assert.equal(roofAccess.subtotalCents, 20900, 'roof vent service includes $50 access fee');
assert.equal(roofAccess.discountCents, 2090, 'SAVE10 normalizes case for roof vent service');
assert.equal(roofAccess.totalCents, 18810, 'roof vent total after 10%');

assert.deepEqual(
  normalizeAddOns(['same-day', 'bad-id', 'crawl-space', 'same-day']),
  ['same-day', 'crawl-space'],
  'add-on normalization accepts only supported add-ons in canonical order',
);
assert.equal(getServiceTypeForAccessMethod('toilet-pull'), 'sewer-inspection-toilet', 'legacy toilet access maps to toilet service');
assert.equal(getServiceTypeForAccessMethod('roof-vent'), 'sewer-inspection-roof', 'legacy roof access maps to roof service');
assert.equal(getAccessMethodForServiceType('sewer-inspection-roof'), 'roof-vent', 'service maps to Stripe access method');
assert.equal(isPromoCodeValid(' save10 '), true, 'promo code normalizes whitespace/case');
assert.equal(isPromoCodeValid('SAVE9'), false, 'invalid promo rejected');
assert.equal(formatCents(14310), '$143.10', 'cents formatting preserves decimals');

console.log('checkout-pricing-check: PASS');
