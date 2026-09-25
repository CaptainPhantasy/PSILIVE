# Precision Sewer Inspection editing copy

GitHub origin: https://github.com/CaptainPhantasy/precision-sewer-inspection.git

This copy is authorized for edits and public publication only at https://precision-sewer-inspection-edits.captainphantasy.chatgpt.site. Do not push to the original GitHub repository until Floyd explicitly requests it. The checkout's GitHub push address is disabled; the separate `sites` remote is authorized.

All original pages, assets, API routes, data models, and service integrations are retained. `scripts/build-sites-preview.mjs` exports pages in a temporary directory, preserves the original application source, and packages the exported pages with `sites/booking-worker.mjs`.

On September 25, 2026, the owner requested restoration of the current sales funnel, Stripe integration and Google Calendar integration while retaining the IDC merger. The booking page again uses the original four-step contact form. The Sites worker forwards only the existing public availability, checkout, payment confirmation and booking-lead endpoints to https://precisionsewerinspections.com. Stripe returns customers to the editing site's confirmation page; the existing PSI service verifies payment and books Google Calendar. No credentials, webhook configuration, pricing or calendar ownership are copied or changed. The original GitHub no-push restriction remains in force.

This host can now accept actual inspection bookings. Agent verification must use mocked writes: do not create real payments, appointments, leads or notifications as tests. Read-only public availability may be checked. Other inquiry forms retain their existing delivery behavior. AI, staff accounts and a separate database are not provisioned on the editing host.

For Sites, use `npm run build`, package `dist/` (Worker and `client/` assets), and publish only to the project ID in `.openai/hosting.json`. `npm run build:original` retains the original Next.js application build. The original Yarn lockfile is preserved under `.sites-original/yarn.lock`; npm retains the existing dependency versions.
