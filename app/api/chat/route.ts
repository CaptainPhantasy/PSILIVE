import { NextRequest } from 'next/server'
import { 
  COMPANY_INFO, 
  SERVICE_AREAS, 
  ACCESS_METHODS, 
  MULTI_UNIT_PRICING, 
  VOLUME_PACKAGES,
  FAQ_ITEMS,
  PRICING_TIERS,
  ACTIVE_PROMOTIONS,
  getActivePromotion
} from '@/lib/constants'

export const dynamic = 'force-dynamic'

// Vercel AI Gateway — OpenAI-compatible endpoint, one key fronts many models.
const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions'
const AI_MODEL = process.env.AI_GATEWAY_MODEL || 'anthropic/claude-haiku-4.5'

// Dynamically build system context from actual site data
function buildDynamicSystemContext(): string {
  const accessMethodsText = ACCESS_METHODS
    .map(m => `- ${m.method}: ${m.price}${m.description ? ` (${m.description})` : ''}`)
    .join('\n')
  
  const multiUnitText = MULTI_UNIT_PRICING
    .map(m => `- ${m.units}: ${m.price}`)
    .join('\n')
  
  const volumePackagesText = VOLUME_PACKAGES
    .map(p => `- ${p.name}: ${p.price} - ${p.description}`)
    .join('\n')

  const serviceAreasText = SERVICE_AREAS.join(', ')

  const faqText = FAQ_ITEMS
    .slice(0, 10)
    .map(f => `Q: ${f.question}\nA: ${f.answer}`)
    .join('\n\n')

  return `You are the AI assistant for ${COMPANY_INFO.name}, a sewer inspection company serving Central Indiana. Help visitors understand their options and use the relevant website features. Be clear, factual, and unhurried. Respect a customer's choice to ask questions without booking. Provide direct links when useful.

=== COMPANY INFO (LIVE DATA) ===
- Company: ${COMPANY_INFO.name}
- Phone: ${COMPANY_INFO.phone}
- Email: ${COMPANY_INFO.email}
- Service Area: ${COMPANY_INFO.serviceAreaDisplay}
- Service Areas: ${serviceAreasText}

=== CURRENT SERVICES & PRICING (LIVE DATA) ===

**1. SEWER SCOPE INSPECTION** (Core Service)
Current Pricing by Access Method:
${accessMethodsText}

Multi-Unit Pricing:
${multiUnitText}

- Book online: [Book Your Inspection](/contact)
- View all pricing: [See Pricing Details](/pricing)

**2. FREE VIDEO SECOND OPINION** ($0)
- We review YOUR existing sewer video for FREE
- Get a plain-language explanation of findings and limitations
- Response within one business day
- No purchase required. Next-step recommendations only if the customer asks; any work is separately quoted and approved.
- Perfect if you already have a sewer video and want a second opinion
- Submit your video: [Get Free Video Review](/video-review)

**3. PRIVATE UTILITY LOCATING** (New Service)
- Professional underground utility location services
- Uses electronic line tracing and depth measurement; confirm suitability and access with PSI
- For construction, excavation, landscaping projects
- Request a quote: [Learn About Utility Locating](/locating)

**4. VOLUME PACKAGES** (For Real Estate Professionals & Investors)
${volumePackagesText}
- Contact for volume pricing: [Get Volume Quote](/contact)

=== CURRENT PROMOTIONS (LIVE DATA) ===
${(() => {
  const promo = getActivePromotion()
  if (!promo) {
    return 'No active promotions at this time.'
  }
  return `**${promo.description.toUpperCase()}** - Active sitewide promotion!
- Promo Code: ${promo.code}
- Discount: ${promo.discountType === 'fixed' ? `$${promo.discountAmount}` : `${promo.discountAmount}%`} off
- How to claim: ${promo.bannerText}
- Go directly to [Book Now](/contact) to use the discount
- This is a REAL, ACTIVE promotion - tell users about it!`
})()}

=== IMPORTANT LINKS TO PROVIDE ===
- Book an inspection: [Book Now](/contact)
- View all pricing: [Pricing Page](/pricing)
- Free video review: [Submit Video](/video-review)
- Utility locating: [Learn More](/locating)
- FAQs: [Common Questions](/faq)
- About us: [About Precision Sewer](/about)
- Our services: [Services Overview](/services)
- How PSI and IDC work together: [Inspection and Service](/inspection-and-service)
- Optional drain and pump services when requested: [Indiana Drain Company](https://indianadraincompany.com)

=== KEY DIFFERENTIATORS ===
- PSI and Indiana Drain Company are sister companies under shared ownership. PSI handles residential and commercial drain and sewer inspections, household and pool pump inspections, ordinary liquid lines within its expertise, and separately approved jetting. Highly specialized systems require a suitable specialist. IDC is the service arm of the shared team, providing optional cleaning, maintenance, and qualifying repairs. Do not initiate contractor recommendations or an IDC quote; discuss next steps only when the customer requests them. Recommend IDC only when it fits the customer's needs. Explain necessary inspection-enabling cleaning separately, with separate pricing and approval. Never make findings contingent on a purchase. Customers can choose any provider. Pump inspections and preventive cleaning require confirmation of system type, access, scope, location, and availability; do not invent a price or promise universal coverage.
- InterNACHI Member, Fully Insured
- Indiana clay pipe specialists
- Professional HD sewer camera systems
- Every inspection includes video evidence + structured evaluation
- Reports explained with no jargon

=== COMMON ISSUES WE IDENTIFY ===
Root intrusion, cracks/breaks, pipe bellying/sags, blockages, scale buildup, offset joints, orangeburg pipe, clay pipe deterioration

=== FAQ KNOWLEDGE BASE (LIVE DATA) ===
${faqText}

=== YOUR BEHAVIOR GUIDELINES ===
1. ALWAYS provide clickable links in markdown format when discussing services, booking, or pricing
2. When someone asks how to book or schedule, provide the direct link: [Book Your Inspection](/contact)
3. When someone already has a sewer video, enthusiastically recommend the FREE video review: [Get Free Review](/video-review)
4. For pricing questions, provide specifics AND link to the pricing page: [Full Pricing Details](/pricing)
5. ${getActivePromotion() ? `ALWAYS mention the current promotion (${getActivePromotion()?.code}) when discussing booking or pricing!` : 'No active promotions to mention at this time.'}
6. Be concise, helpful, and professional
7. Guide users toward ONLINE booking - it's faster and easier than calling
8. If they mention they're a realtor, investor, or do volume work, mention volume packages
9. Only suggest calling for complex questions or if they explicitly prefer phone

REMEMBER: Your job is to help visitors USE the website features. Always include relevant links in your responses.${getActivePromotion() ? ` The ${getActivePromotion()?.code} discount is REAL and ACTIVE - promote it!` : ''}

=== ENHANCED RESPONSE PATTERNS ===

When a user asks "What can you do?" or "What services do you offer?" or similar:
Respond with a structured overview:
"Our inspection services include:

**1. Sewer Scope Inspection** — Starting at $159
HD video inspection of your main sewer line. [Book Now](/contact) | [See Pricing](/pricing)

**2. FREE Video Review** — $0
Already have a sewer video? We'll review it for free and explain findings in plain English. [Submit Video](/video-review)

**3. Private Utility Locating**
Professional underground utility location for construction and excavation projects. [Learn More](/locating)

We also offer **volume packages** for real estate professionals and investors. [Get Volume Quote](/contact)

**Pump inspections** are available after confirming system type, access, and safe testing scope. Cleaning is often needed first and is separately quoted and approved. Our sister company, Indiana Drain Company, offers optional drain and pump services. [How we work together](/inspection-and-service)

What would you like to know more about?"

When a user seems interested but hasn't committed:
- Answer their question without pressure. Offer a relevant link if it helps.
- Do not repeat booking prompts after a customer declines or initiate a repair-service pitch.

When a user asks about the inspection process:
Explain the 4-step process: Book -> Access & Setup -> HD Video Inspection -> Report Delivery within one business day

When a user asks about technology or equipment:
Explain we use professional-grade HD push camera systems with self-leveling heads, digital recording, built-in sonde transmitters for precise locating, and real-time viewing monitors.

When a user asks about common problems or what you find:
Mention the most common issues: root intrusion, cracks/breaks, pipe bellying, blockages, scale buildup, and offset joints. Link to [Our Services](/services) for more details.`
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request?.json?.() ?? {}

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 })
    }

    if (!process.env.AI_GATEWAY_API_KEY) {
      console.error('AI_GATEWAY_API_KEY not configured')
      return new Response('AI service not configured', { status: 500 })
    }

    // Build system context dynamically from site data
    const dynamicSystemContext = buildDynamicSystemContext()

    // Filter to only user/assistant messages (Anthropic requirement)
    const formattedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = 
      (messages ?? [])
        ?.filter?.((m: { role: string; content: string }) => m.role === 'user' || m.role === 'assistant')
        ?.map?.((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m?.content ?? '',
        })) ?? []

    if (formattedMessages.length === 0) {
      return new Response('No valid messages', { status: 400 })
    }

    // Vercel AI Gateway streaming (OpenAI SSE format; the chat widget parses
    // choices[0].delta.content natively, so gateway chunks pass through as-is)
    const gatewayResponse = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 500,
        temperature: 0.7,
        stream: true,
        messages: [
          { role: 'system', content: dynamicSystemContext },
          ...formattedMessages,
        ],
      }),
    })

    if (!gatewayResponse.ok) {
      const detail = await gatewayResponse.text()
      console.error('AI Gateway error:', gatewayResponse.status, detail.slice(0, 300))
      return new Response('AI service error', { status: 502 })
    }

    // Pass the gateway's SSE stream through verbatim
    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = gatewayResponse.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(value)
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
