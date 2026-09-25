# PSI Checkout Flow Issues & Fixes Tracker

**Status:** Reinspected and actively fixed on 2026-05-27.
**Canonical live handoff record:** `SSOT/CHECKOUT_FLOW_SSOT.md`.
**Instruction:** Keep the SSOT file current after each material finding, edit, verification result, or blocker.

## Verified customer-facing flaws

1. **Access charge verification was weak**
   - Customers could continue without explicitly confirming whether standard cleanout access was available or whether toilet pull / roof vent charges were needed.

2. **Promo implementation did not match the reported 10% expectation**
   - Prior code advertised and implemented `SAVE10` as a fixed $10 discount.
   - Manual promo entry also depended on a client-supplied discount amount, so typing `SAVE10` could fail unless localStorage had been populated from the banner.

3. **Needed add-ons were not purchasable end-to-end**
   - UI had no complete list of available add-ons.
   - Server only handled `same-day` and `crawl-space`; other priced products existed in Stripe constants but were not selectable/charged from checkout.

4. **Back/edit flow was fragile**
   - Review allowed returning to sections, but customer selections were not preserved across Stripe cancel/back navigation.
   - Service/access edits needed to be directly visible and priced before confirmation.

5. **Customer-facing copy was inconsistent**
   - Promo banner, chat, constants, locating page, and checkout route had inconsistent promotion language.

## Applied fixes in current working tree

- Added shared pricing source in `lib/checkout-pricing.ts`.
- Changed `SAVE10` to a 10% promotion in shared logic and customer-facing promo copy.
- Updated Stripe checkout to use a 10% coupon (`SAVE10_PERCENT`) and validate promo by code only.
- Added full add-on pricing support for same-day delivery, crawl space, cleanout cap replacement, and additional cleanout inspection.
- Added explicit access verification checkbox before leaving job details.
- Added draft persistence through `sessionStorage` so `/contact` state survives Stripe cancel/back.
- Updated review pricing to show service, selected add-ons, subtotal, discount, tax, and total from the same pricing helper.
- Removed misleading `$10 Off Your First Locate` banner from the locating customer flow.
- Added focused pricing verification script: `scripts/checkout-pricing-check.ts`.
- Added noninteractive ESLint config and updated `npm run lint` to use it.

## Verification required before final local commit

- `npx tsc --noEmit --pretty false`
- `npx tsx scripts/checkout-pricing-check.ts`
- `npm run lint`
- `npm run build`
- Git steward audit: identity, staged files, secret pattern count, gitignore coverage.

## Push policy

Do not push. User explicitly instructed not to push.
