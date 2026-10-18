import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/service-areas'

/**
 * Keep public pages crawlable for search and the existing AI crawler policy.
 * Search access and model-training access are separate crawler controls.
 * Googlebot controls Google Search and its AI features; Google-Extended
 * controls certain uses outside Search. An allow rule is access permission,
 * not an endorsement, ranking signal, or promise of inclusion.
 */
const DISALLOW = ['/api/', '/admin', '/technician', '/booking/success', '/maintenance']

const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', // OpenAI / ChatGPT
  'ClaudeBot', 'Claude-Web', 'anthropic-ai', // Anthropic / Claude
  'PerplexityBot', 'Perplexity-User', // Perplexity
  'Google-Extended', // certain Gemini uses outside Google Search
  'Applebot-Extended', // Apple Intelligence
  'Amazonbot', 'Bytespider', 'CCBot', 'cohere-ai', 'Meta-ExternalAgent', 'Meta-ExternalFetcher',
]

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow: DISALLOW })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
