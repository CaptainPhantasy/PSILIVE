import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/service-areas'

/**
 * Explicitly WELCOME the AI / LLM search crawlers (Generative Engine
 * Optimization) alongside classic SEO bots. Listing each by name with
 * `allow: '/'` is an active "you are welcome here" signal and guards against a
 * future wildcard rule accidentally shutting them out. Private surfaces
 * (/api, /admin, /technician) stay disallowed for everyone.
 */
const DISALLOW = ['/api/', '/admin/', '/technician/']

const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', // OpenAI / ChatGPT
  'ClaudeBot', 'Claude-Web', 'anthropic-ai', // Anthropic / Claude
  'PerplexityBot', 'Perplexity-User', // Perplexity
  'Google-Extended', // Google Gemini & AI Overviews
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
