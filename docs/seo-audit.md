# Search readiness review

Reviewed October 10, 2026. Baseline: editing-copy v12, commit `94d63dc65194c2840ac18d8066d90b3b868fd217`. Review covers the exported HTML for 49 routes, including 33 public content pages, and the original Next.js source.

The scores are practical assessments of readiness under the rubric below. They are not Google scores, rankings, a traffic forecast, measured search visibility, or measured AI citations.

| Area | Maximum | Before | After validated changes |
| --- | ---: | ---: | ---: |
| Discovery and index controls | 25 | 20 | 24 |
| Page metadata | 20 | 12 | 19 |
| Structured business information | 20 | 10 | 17 |
| Useful content and internal discovery | 20 | 18 | 18 |
| Page experience | 15 | 8 | 12 |
| Total | 100 | 68 | 90 |

The final assessment is 90/100 after the combined build and both-theme accessibility checks passed. Field performance and actual search behavior remain unmeasured.

## What was weak

Three public routes—areas, locating and video review—identified the homepage as their canonical page. Locating and video review also inherited its title and description. Many sharing cards had no page-specific URL; social descriptions and business markup contained delivery or certification claims that this review could not independently confirm. Some titles repeated the company name.

The two business-markup systems described the same company differently. Service-area pages created separate business identifiers, and Indianapolis was used as the business location despite the existing company record saying Nashville. The markup also included a search action with no working site-search interface and inappropriate keyword strings as additional types. Optional rating markup could imply self-serving review eligibility.

Every static sitemap entry claimed a fresh modification date on each request. That timestamp represented generation time, not a content update.

## Changes

- Added a shared metadata helper and complete route-specific titles, descriptions, canonical addresses and sharing cards. Kept the supplied contractor artwork.
- Preserved every page URL, booking workflow and existing asset.
- Unified business identity across the schema helpers. Service-area pages describe coverage by one business, with no invented branch offices. The existing Nashville locality is used without adding a public street address.
- Removed unverified claims from shared metadata and schema, phantom search actions, keyword-type strings and self-rating markup. Visible customer reviews remain intact.
- Added website identity and article markup using the resource pages' existing titles, author names and publication dates.
- Kept only genuine database modification dates in the sitemap. Dates are omitted where no reliable edit record exists.
- Corrected crawler comments and private-route exclusions while retaining the existing search/training crawler policy.

## Validation

The baseline export produced 54 distinct failures under `scripts/audit-seo.mjs`. The checks cover canonical paths, unique public titles, sharing addresses and descriptions, existing sharing-image files, one main heading, internal links, valid structured JSON, company identity, sitemap coverage and preview index controls. Source syntax checks and direct checks of identity, canonical generation and safely escaped JSON passed. The combined build and full source TypeScript check passed. The final exported-page audit passed all 49 routes and 33 public content pages with zero failures. All 98 rendered OG/Twitter image references resolve to nonempty exported assets: the existing site sharing image or the supplied contractor hero. All 97 rendered local page-image references also resolve to nonempty files across 14 distinct assets; none use external image sources. The final accessibility interaction run covered 200 states and 192 scans with zero violations or keyboard/focus failures; 132 pixel contrast samples and the four final maintenance viewport/theme checks also passed.

The separate editing copy deliberately remains excluded from search through its build's index controls and robots file. Canonical URLs still identify the production domain. These improvements are reviewable here; the original GitHub repository and original production website have not been changed. Live search results will require applying reviewed changes to the production site through an authorized release.

Remaining evidence: verified Google Business Profile details and exact profile URL, current business location policy, Search Console indexing reports, measured field speed, and real search/AI referral and citation observations. No business facts were invented to fill these gaps.

## Official guidance consulted

- [Google canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google local business structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [Google review snippet guidance](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
- [Google title guidance](https://developers.google.com/search/docs/appearance/title-link)
- [Google AI features and website guidance](https://developers.google.com/search/docs/appearance/ai-features)

The guidance supports accurate canonical URLs, trustworthy modification dates, descriptive titles, visible-content-aligned markup and normal search fundamentals. It does not require special AI markup or promise inclusion.
