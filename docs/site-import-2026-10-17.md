# Editing-site updates with the existing sales funnel preserved

Source: PSI editing Site version 14, commit `4335106e63f57e0f49e865144bc96a1f8fdb943c`.
Baseline: `CaptainPhantasy/PSILIVE`, commit `823a583ff0f62228bbf6f25aeb7e190df624d5b0`.
Branch: `site-updates-preserve-sales-funnel-2026-10-17`.

## Included

- Contractor lateral-lining page, supporting content, artwork, and navigation links.
- Google review display and its existing source-evidence notes.
- Page titles, descriptions, canonical links, structured search information, sitemap, and crawler information.
- Readability, contrast, focus indicators, FAQ labels, and navigation/accessibility-toolbar improvements.
- Existing editing-site documentation and audit scripts, copied without treating their historical results as fresh verification.

## Preserved from GitHub

The booking form, booking confirmation, all API routes, payment processing, calendar integration, lead capture, pricing, service constants, database schema, dependencies, build configuration, and hosting configuration remain unchanged.

Six editing-site changes were deliberately excluded: the contact form, booking-success metadata layout, AI chat, admin login, technician layout, and technician login. These operational surfaces are retained exactly as they were in the baseline. No files were deleted or quarantined.

This branch does not migrate the application to a different host, connect new credentials, create live transactions, or change `main` or `preview`.

## Verification

- Nine existing booking-bridge tests passed using intercepted service responses, including availability, checkout payload, confirmation, and failure handling.
- Existing checkout-pricing checks passed, covering service/access selections, add-ons, discounts, and totals.
- Byte comparison verified 145 protected files against the baseline.
- Changed scripts passed JavaScript syntax checks; contractor content parsed successfully; changed files passed credential-pattern and whitespace checks.
- `npm run build` passed, including compilation, TypeScript checks, and page generation.
- The existing search/link audit passed across 33 public pages (49 total pages), with no reported failures.
- Rendered home, pricing, contact, and contractor pages retained booking links. The rendered contact page retained the four-step indicator, service selector, property/access fields, access verification, and continue control.

These checks do not represent an actual charge, appointment, or email delivery. Production payment/calendar credentials were not used.

## PSI–IDC information correction

The follow-up correction broadens the site and services-page descriptions to include drain and pump inspections and optional IDC services. Business structured information now explicitly describes shared ownership and the separately approved IDC service relationship, links the existing explanation page, and restores PSI inspection offers. Standard, toilet-pull, and roof-access prices are read from the existing checkout options rather than maintained as a second price list. Individual service offer prices and package features are restored from the existing service records. No IDC price or automatic customer/job transfer is introduced.
