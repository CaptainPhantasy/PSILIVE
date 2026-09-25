/**
 * Shared telemetry for the diversity / accessibility engines.
 *
 * This site runs GA4 directly via @next/third-parties (gtag), NOT a GTM
 * container — so a `dataLayer.push` alone does not reach GA4. The live wire
 * is the existing `trackEvent` helper (gtag/sendGAEvent). We still push to
 * `dataLayer` as harmless future-proofing in case a GTM container is added
 * later; both paths are best-effort and never throw.
 */
import { trackEvent } from '@/lib/analytics'

type Primitive = string | number | boolean | null | undefined

export interface DiversityTelemetryEvent {
  /** GTM-style event name, e.g. 'theme_change'. */
  event: string
  /** Flat parameter bag attached to the event. */
  params?: Record<string, Primitive>
}

function getDataLayer(): unknown[] | null {
  if (typeof window === 'undefined') return null
  const w = window as Record<string, unknown>
  if (!Array.isArray(w.dataLayer)) w.dataLayer = []
  return w.dataLayer as unknown[]
}

/**
 * Emit a single diversity event to every available analytics sink.
 * Safe to call on the server (becomes a no-op) and never throws.
 */
export function emitDiversityEvent({ event, params = {} }: DiversityTelemetryEvent): void {
  if (typeof window === 'undefined') return

  // 1) Live path: GA4 via the project's existing gtag helper.
  try {
    // Pick the most descriptive label available for GA's event_label slot.
    const label = Object.values(params).find((v) => typeof v === 'string') as string | undefined
    const numeric = Object.values(params).find((v) => typeof v === 'number') as number | undefined
    trackEvent({
      action: event,
      category: 'accessibility',
      label,
      value: numeric,
    })
  } catch {
    /* analytics must never break the UI */
  }

  // 2) Future-proof path: GTM dataLayer (no-op until a container exists).
  try {
    const dl = getDataLayer()
    dl?.push({ event, ...params })
  } catch {
    /* ignore */
  }
}
