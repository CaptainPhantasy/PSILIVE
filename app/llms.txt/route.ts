import { NextResponse } from 'next/server'
import { SERVICE_AREA_LINKS, SITE_URL } from '@/lib/service-areas'
import { COMPANY_INFO } from '@/lib/constants'
import { getAllPosts } from '@/lib/blog'

/**
 * A plain-text map of public PSI pages and service responsibilities.
 * This optional summary does not replace the visible pages or guarantee
 * crawling, indexing, AI citations, or search placement.
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
    (a) => `- [Sewer Inspection in ${a.name}, IN](${base}/sewer-inspection/${a.slug}): Camera inspection information for ${a.name}, Indiana homeowners, buyers, and realtors. Confirm the job address and inspection scope with PSI.`,
  ).join('\n')

  const resourceLines =
    posts.length > 0
      ? posts.map((p) => `- [${p.title}](${base}/resources/${p.slug}): ${p.description}`).join('\n')
      : `- [Resources & Blog](${base}/resources)`

  const body = `# ${COMPANY_INFO.name}

> Precision Sewer Inspections (PSI) provides sewer camera inspections, recorded video, written findings, and explanations of inspection limits for homeowners, buyers, realtors, property managers, and contractors in Central Indiana. Confirm the job address, access, inspection scope, price, and documentation delivery before booking. Sister company Indiana Drain Company (IDC) offers optional service separately from PSI's inspection findings.

- Phone: ${COMPANY_INFO.phone}
- Email: ${COMPANY_INFO.email}
- Service area: ${COMPANY_INFO.serviceArea}; confirm the specific job address
- Book online: ${base}/contact

## Core pages
- [Book an Inspection](${base}/contact): Confirm inspection scope, site access, price, and documentation delivery before booking.
- [Services](${base}/services): Camera inspections for residential and commercial properties, with inspection coverage and access options explained.
- [Pricing](${base}/pricing): Posted standard inspection and access pricing. Confirm the total for your scope; contractor lining work requires project-specific pricing.
- [Contractor Lateral Lining Inspections](${base}/contractors/lateral-lining-inspections): Pre-lining and post-lining camera documentation for contractors arranging sanitary sewer lateral rehabilitation in Citizens Energy Group's service area. PSI confirms the location, recording scope, deliverables, and price for the project.
- [Free Video Second Opinion](${base}/video-review): Have existing inspection footage explained at no charge, with no service purchase required.
- [Utility Locating](${base}/locating): Sewer-line and underground locating scope, approximate findings, and limitations.
- [Inspection and Service](${base}/inspection-and-service): How PSI and IDC work together, optional cleaning and pump services, and customer choice.
- [About](${base}/about): PSI's inspection approach, inspector information, and optional service through IDC.
- [FAQ](${base}/faq): Questions about inspection coverage, access, findings, and limitations.

## Service-area pages
${areaLines}
- [All service areas](${base}/areas)

## Resources and guides
${resourceLines}

## Contractor project responsibilities
- PSI provides the agreed camera recording and independent findings. Contractor lining documentation, pricing, recording coverage, format, and delivery are confirmed for the particular project.
- Citizens' lateral-lining process requires pre-repair and post-repair video. Pre-repair recording covers all sections to be reused, shows issues clearly, includes footage measurements, and records toward and away from the sanitary sewer.
- The contractor names the pre-repair file with the address and a before indication, uploads to the designated Box.com folder, and notifies REACH@CitizensEnergyGroup.com. After installation, the contractor uploads post-repair video and requests Citizens' lateral inspection.
- The project team handles the application, applicable variance, installation, uploads, utility notifications, and inspection request. Citizens controls review and acceptance. PSI does not issue permits or guarantee acceptance.
- Source details: Citizens' lateral-lining fact sheet is revised July 14, 2026. The 2026 sanitary standards manual is revised January 2026; section 404.06 requires case-by-case utility variance approval. Links checked October 10, 2026.
- [Citizens lateral-lining fact sheet (PDF)](https://info.citizensenergygroup.com/hubfs/site/permits%20and%20forms%20documents/Sanitary-Sewer-Lateral-Lining-Fact-Sheet.pdf)
- [Citizens permits, forms, and inspection requests](https://info.citizensenergygroup.com/permits-and-forms)
- [Citizens 2026 sanitary standards manual (PDF)](https://info.citizensenergygroup.com/hubfs/site/permits%20and%20forms%20documents/2026%20Sanitary%20Standards%20Manual.pdf)

## Inspection independence and optional service
- PSI and IDC are sister companies under shared ownership. PSI inspects residential and commercial drains and sewers, accessible household and pool pumps, and ordinary liquid lines within its equipment and expertise. Separately approved hydro jetting is available; specialized systems require a suitable specialist.
- IDC is the service arm of the shared team. Repair consultation and contractor recommendations are discussed only when requested. Any relevant relationship is disclosed, and customers remain free to choose IDC, another provider, or no further service. Findings do not depend on a service purchase.
- Cleaning or other work needed to improve inspection access is explained, priced, and authorized separately. Obstructions or access limits can prevent complete coverage; PSI documents those limits.
- Confirm report delivery with PSI when booking. Contractor lining documentation follows the agreed project scope rather than a blanket price or delivery promise.
`

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
