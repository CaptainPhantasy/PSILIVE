import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'
import { withDatabaseFallback } from '@/lib/prisma-timeout'
import { SERVICE_AREA_LINKS, SITE_URL } from '@/lib/service-areas'
import { getAllPosts } from '@/lib/blog'

// Refresh hourly so areas/posts added later surface without a redeploy.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL
  const now = new Date()

  // Core static marketing pages.
  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { path: '', changeFrequency: 'weekly' as const, priority: 1 },
      { path: '/services', changeFrequency: 'weekly' as const, priority: 0.9 },
      { path: '/pricing', changeFrequency: 'weekly' as const, priority: 0.9 },
      { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.9 },
      { path: '/areas', changeFrequency: 'weekly' as const, priority: 0.8 },
      { path: '/locating', changeFrequency: 'monthly' as const, priority: 0.8 },
      { path: '/realtors', changeFrequency: 'monthly' as const, priority: 0.8 },
      { path: '/video-review', changeFrequency: 'monthly' as const, priority: 0.8 },
      { path: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
      { path: '/inspection-and-service', changeFrequency: 'monthly' as const, priority: 0.8 },
      { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.7 },
      { path: '/resources', changeFrequency: 'weekly' as const, priority: 0.7 },
      { path: '/support', changeFrequency: 'yearly' as const, priority: 0.4 },
      { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
    ] as const
  ).map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  // Service-area landing pages — live DB first, canonical list as a safe fallback.
  const areas = await withDatabaseFallback(
    prisma.serviceArea.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    SERVICE_AREA_LINKS.map((a) => ({ slug: a.slug, updatedAt: now })),
  )
  const areaRoutes: MetadataRoute.Sitemap = areas.map((a) => ({
    url: `${baseUrl}/sewer-inspection/${a.slug}`,
    lastModified: a.updatedAt ?? now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Resources / blog posts.
  let resourceRoutes: MetadataRoute.Sitemap = []
  try {
    resourceRoutes = getAllPosts().map((p) => ({
      url: `${baseUrl}/resources/${p.slug}`,
      lastModified: p.date ? new Date(p.date) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))
  } catch {
    resourceRoutes = []
  }

  return [...staticRoutes, ...areaRoutes, ...resourceRoutes]
}
