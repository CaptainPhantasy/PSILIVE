/**
 * Canonical service-area list — the SINGLE source of truth for the cities that
 * have a live `/sewer-inspection/<slug>` landing page.
 *
 * Must stay in sync with prisma/seed-service-areas.ts (these 13 slugs are what
 * `generateStaticParams` prerenders). Used by the footer (internal links), the
 * sitemap (DB fallback), and llms.txt — so every discovery surface points at the
 * SAME real, rendered pages instead of drifting (the bug that left these pages
 * built-but-unadvertised).
 */
export interface ServiceAreaLink {
  name: string
  slug: string
}

export const SERVICE_AREA_LINKS: ServiceAreaLink[] = [
  { name: 'Indianapolis', slug: 'indianapolis-in' },
  { name: 'Carmel', slug: 'carmel-in' },
  { name: 'Fishers', slug: 'fishers-in' },
  { name: 'Noblesville', slug: 'noblesville-in' },
  { name: 'Greenwood', slug: 'greenwood-in' },
  { name: 'Avon', slug: 'avon-in' },
  { name: 'Plainfield', slug: 'plainfield-in' },
  { name: 'Brownsburg', slug: 'brownsburg-in' },
  { name: 'Zionsville', slug: 'zionsville-in' },
  { name: 'Geist', slug: 'geist-indianapolis-in' },
  { name: 'Westfield', slug: 'westfield-in' },
  { name: 'Franklin', slug: 'franklin-in' },
  { name: 'Greenfield', slug: 'greenfield-in' },
]

/** Canonical, non-www production origin (middleware 301s www → non-www). */
export const SITE_URL = 'https://precisionsewerinspections.com'
