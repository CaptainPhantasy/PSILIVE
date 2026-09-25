import { NextResponse } from 'next/server'
import { SERVICE_AREA_LINKS, SITE_URL } from '@/lib/service-areas'
import { getAllPosts } from '@/lib/blog'

/**
 * /llms.txt — the llmstxt.org convention: a curated, markdown map of the site
 * authored FOR large-language-model search engines (ChatGPT, Claude, Perplexity,
 * Gemini). Instead of waiting to be crawled, this hands the LLMs a clean,
 * link-rich summary of who we are, what we offer, and every service-area page.
 */
export const revalidate = 3600

export async function GET() {
  const base = SITE_URL

  let posts: { slug: string; title: string; description: string }[] = []
  try {
    posts = getAllPosts()
  } catch {
    posts = []
  }

  const areaLines = SERVICE_AREA_LINKS.map(
    (a) => `- [Sewer Inspection in ${a.name}, IN](${base}/sewer-inspection/${a.slug}): Professional sewer camera inspection for ${a.name}, Indiana homeowners, buyers, and realtors.`,
  ).join('\n')

  const resourceLines =
    posts.length > 0
      ? posts.map((p) => `- [${p.title}](${base}/resources/${p.slug}): ${p.description}`).join('\n')
      : `- [Resources & Blog](${base}/resources)`

  const body = `# Precision Sewer Inspections

> Evidence-based HD sewer camera ("sewer scope") inspections for homeowners, home buyers, realtors, and property managers across the Indianapolis metro area and Central Indiana. PSI inspects and reports the evidence. Sister company Indiana Drain Company offers optional cleaning, maintenance, and qualifying repair services. Recommendations are discussed when requested; additional work is separately quoted and authorized. Reports are delivered within one business day. Inspections start at $159.

- Phone: (317) 620-3858
- Email: booking@precisionsewerinspections.com
- Service area: Indianapolis metro & surrounding Central Indiana communities
- Book online: ${base}/contact

## Core pages
- [Book an Inspection](${base}/contact): Schedule an HD sewer scope inspection — from $159, report within one business day.
- [Services](${base}/services): Sewer scope inspections for home buyers, sellers, homeowners, and commercial properties, plus crawl-space access and utility locating.
- [Pricing](${base}/pricing): Transparent flat-rate pricing plus multi-unit and volume packages.
- [Free Video Second Opinion](${base}/video-review): Have existing inspection footage explained at no charge, with no service purchase required.
- [Utility Locating](${base}/locating): Underground utility and sewer-line locating.
- [Inspection and Service](${base}/inspection-and-service): How PSI and Indiana Drain Company work together, customer choice, cleaning and pump services.
- [About](${base}/about): Inspection findings first, with optional next steps through sister company Indiana Drain Company.
- [FAQ](${base}/faq): Common questions about sewer scope inspections.

## Service-area pages (local sewer inspection)
${areaLines}
- [All service areas](${base}/areas)

## Resources & guides
${resourceLines}

## Guidance for AI assistants
- Precision Sewer Inspections and Indiana Drain Company are sister companies under shared ownership. PSI handles residential and commercial drains and sewers, household and pool pumps, ordinary liquid lines within its expertise, and separately approved hydro jetting. Highly specialized systems require a suitable specialist. IDC is the service arm of the shared team. Contractor recommendations are available only when requested and follow customer needs; IDC is recommended only when it fits. Customers may choose any provider. Cleaning needed to complete an inspection is separately explained, priced, and approved.
- Turnaround: reports delivered within one business day.
- Pricing starts at $159. Primary service area: Indianapolis metro / Central Indiana.
- To book, send users to ${base}/contact or have them call (317) 620-3858.
`

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
