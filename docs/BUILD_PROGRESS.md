# PSI BRAND VISIBILITY PLATFORM - BUILD PROGRESS

## Executive Summary

**What:** Internal Yext-equivalent for Precision Sewer Inspections
**Purpose:** Complete brand visibility management without $50k-500k/year software costs
**Status:** 60% Complete - Core infrastructure built

---

## WHAT'S BEEN BUILT

### 1. DATABASE SCHEMA EXTENSIONS ✅
**File:** `prisma/visibility-schema.prisma`

New models added to your existing Prisma schema:

| Model | Purpose |
|-------|---------|
| `ServiceArea` | Cities/regions you serve |
| `ServiceOffering` | Services with pricing |
| `ServiceAreaPricing` | Area-specific pricing |
| `TechnicianProfile` | Extended technician info |
| `FAQ` | Q&A content |
| `AggregatedReview` | Unified review management |
| `ListingSync` | Directory sync tracking |
| `CitationTracking` | AI mention monitoring |
| `LocalRanking` | Search ranking tracking |
| `ReviewRequest` | Review request automation |

---

### 2. SEED DATA ✅

**Files:**
- `prisma/seed-service-areas.ts`
- `prisma/seed-faqs.ts`

**Data includes:**
- 10 service areas (Indianapolis metro)
- 7 service offerings with pricing
- 24 FAQ entries across all categories

---

### 3. SCHEMA.ORG MARKUP ✅
**File:** `lib/schema/markup.ts`

Automatically generates:
- LocalBusiness schema
- Service schema
- FAQPage schema
- Organization schema
- BreadcrumbList schema
- AggregateRating schema

**Impact:** Google & AI engines can read your pages properly

---

### 4. API ROUTES ✅

**Service Areas:**
- `GET /api/knowledge-graph/service-areas`
- `POST /api/knowledge-graph/service-areas`
- `GET /api/knowledge-graph/service-areas/[id]`
- `PUT /api/knowledge-graph/service-areas/[id]`
- `DELETE /api/knowledge-graph/service-areas/[id]`

**Services:**
- `GET /api/knowledge-graph/services`
- `POST /api/knowledge-graph/services`
- `GET /api/knowledge-graph/services/[id]`
- `PUT /api/knowledge-graph/services/[id]`
- `DELETE /api/knowledge-graph/services/[id]`

**FAQs:**
- `GET /api/knowledge-graph/faqs`
- `POST /api/knowledge-graph/faqs`
- `PATCH /api/knowledge-graph/faqs` (bulk operations)

**Reviews:**
- `GET /api/knowledge-graph/reviews`
- `POST /api/knowledge-graph/reviews`
- `PUT /api/knowledge-graph/reviews/generate-response`

**Scout:**
- `GET /api/knowledge-graph/scout`
- `POST /api/knowledge-graph/scout/track`

---

### 5. REACT COMPONENTS ✅

**Service Area Pages:**
- `components/local-pages/ServiceAreaPage.tsx`
- `components/local-pages/ServiceCard.tsx`
- `components/local-pages/FAQAccordion.tsx`
- `components/local-pages/TechnicianCard.tsx`

**Admin UI:**
- `app/admin/knowledge-graph/page.tsx` (dashboard)
- `app/admin/knowledge-graph/areas/page.tsx` (area management)

**Shared:**
- `components/ui/CTAButton.tsx`

---

### 6. PAGE ROUTES ✅

- `/sewer-inspection/[slug]` - Individual service area pages
- `/areas` - All service areas listing
- `/faq` - FAQ page

---

### 7. LIBRARIES ✅

**Listings Sync Engine:** `lib/listings/sync-engine.ts`
- Google Business Profile integration ready
- Yelp integration ready
- Bing Places integration ready
- Listings verifier
- Sync scheduler

**Review Generator:** `lib/reviews/response-generator.ts`
- AI-powered response generation
- Sentiment analysis
- Theme detection
- Template-based fallback

**Citation Tracker:** `lib/scout/citation-tracker.ts`
- AI engine monitoring (ChatGPT, Gemini, Perplexity, Claude)
- Visibility reporting
- Trend analysis

---

## WHAT'S READY TO USE

### 1. Database Migration
```bash
# Add to your existing schema.prisma file
# Copy content from prisma/visibility-schema.prisma

# Run migration
npx prisma migrate dev --name add_visibility_models
```

### 2. Seed Data
```bash
# Run seed files
npx ts-node prisma/seed-service-areas.ts
npx ts-node prisma/seed-faqs.ts
```

### 3. Pages
Pages auto-generate from database content. Once schema is migrated and seeded, you'll have:
- `/sewer-inspection-indianapolis-in`
- `/sewer-inspection-carmel-in`
- `/sewer-inspection-fishers-in`
- `/sewer-inspection-noblesville-in`
- `/sewer-inspection-greenwood-in`
- `/sewer-inspection-avon-in`
- `/sewer-inspection-brownsburg-in`
- `/sewer-inspection-zionsville-in`
- `/sewer-inspection-geist-indianapolis-in`
- `/faq`

### 4. Admin Dashboard
Access at `/admin/knowledge-graph` to manage:
- Service areas
- Services
- FAQs

---

## WHAT NEEDS YOUR INPUT

### 1. Directory Accounts (Manual Setup Required)
- [ ] Google Business Profile (you mentioned you're working on this)
- [ ] Yelp Business Profile
- [ ] HomeAdvisor/Angi
- [ ] Houzz Pro

See: `docs/DIRECTORY_SETUP_GUIDE.md`

### 2. API Keys (When Ready)
Add to environment:
```
GOOGLE_BUSINESS_API_KEY=xxx
YELP_API_KEY=xxx
OPENAI_API_KEY=xxx (for AI response generation)
```

### 3. Company Information
Update in `lib/schema/markup.ts`:
- Phone number
- Address
- Social media URLs
- Logo URL

---

## WHAT'S REMAINING TO BUILD

### High Priority
1. **Directory API Integration** - Connect to actual Google/Yelp APIs
2. **Review Aggregation** - Pull reviews from Google, Yelp APIs
3. **Photo Management** - Upload/manage business photos

### Medium Priority  
4. **Local Ranking Tracker** - Monitor Google Maps positions
5. **Competitor Benchmarking** - Track competitor visibility
6. **Review Request Automation** - Trigger review requests after service

### Lower Priority (Nice to Have)
7. **Multi-location Support** - If PSI expands
8. **Advanced Analytics Dashboard**
9. **Email Notifications** - Alerts for new reviews, ranking changes

---

## FILE STRUCTURE

```
www.precisionsewerinspections.com/
├── app/
│   ├── admin/
│   │   └── knowledge-graph/
│   │       ├── page.tsx           # Dashboard
│   │       └── areas/
│   │           └── page.tsx       # Area management
│   ├── api/
│   │   └── knowledge-graph/
│   │       ├── service-areas/    # CRUD routes
│   │       ├── services/          # CRUD routes
│   │       ├── faqs/             # CRUD routes
│   │       ├── reviews/           # Review management
│   │       └── scout/            # AI visibility
│   ├── areas/
│   │   └── page.tsx              # Areas listing
│   ├── faq/
│   │   └── page.tsx              # FAQ page
│   └── sewer-inspection/
│       └── [slug]/
│           └── page.tsx           # Dynamic area pages
├── components/
│   ├── local-pages/
│   │   ├── ServiceAreaPage.tsx
│   │   ├── ServiceCard.tsx
│   │   ├── FAQAccordion.tsx
│   │   └── TechnicianCard.tsx
│   └── ui/
│       └── CTAButton.tsx
├── lib/
│   ├── schema/
│   │   └── markup.ts              # Schema.org generator
│   ├── listings/
│   │   └── sync-engine.ts         # Directory sync
│   ├── reviews/
│   │   └── response-generator.ts   # AI responses
│   └── scout/
│       └── citation-tracker.ts    # AI monitoring
├── prisma/
│   ├── visibility-schema.prisma   # New models
│   ├── seed-service-areas.ts      # Area seed data
│   └── seed-faqs.ts              # FAQ seed data
└── docs/
    ├── DIRECTORY_SETUP_GUIDE.md   # Setup instructions
    └── BUILD_PROGRESS.md         # This file
```

---

## NEXT STEPS

1. **Immediate:** Add visibility models to your schema.prisma
2. **Run migrations:** `npx prisma migrate dev`
3. **Seed data:** Run the seed files
4. **Test pages:** Visit `/areas` to see your new pages
5. **Directory accounts:** Complete Google Business Profile setup
6. **API keys:** Add when ready for full automation

---

## SUPPORT

For questions about this platform, refer to:
- Yext comparison: This document explains how PSI-Visibility matches Yext features
- Directory guide: Step-by-step setup for each directory
- Schema documentation: Google Search Central guidelines

---

**Built with ❤️ using Claude + Floyd**
**Last Updated:** 2026-03-26
