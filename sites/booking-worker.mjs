// The editing site reuses PSI's public booking service. Credentials, Stripe
// webhooks, calendar ownership and appointment records stay with that service.
export const BOOKING_ORIGIN = 'https://precisionsewerinspections.com'
const SITE_ORIGIN = 'https://precision-sewer-inspection-edits.captainphantasy.chatgpt.site'
const ROUTES = new Map([
  ['/api/calendar/availability', 'GET'],
  ['/api/stripe/checkout', 'POST'],
  ['/api/booking/confirm', 'POST'],
  ['/api/leads/capture', 'POST'],
  ['/api/leads/notify', 'POST'],
  ['/api/leads/mark-converted', 'POST'],
])

function json(body, status) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}

export async function handleBookingRequest(request, upstreamFetch = (url, init) => fetch(url, init)) {
  const url = new URL(request.url)
  const method = ROUTES.get(url.pathname)
  if (!method) return json({ success: false, error: 'Not found' }, 404)
  if (request.method !== method) return json({ success: false, error: 'Method not allowed' }, 405)
  let body
  if (method === 'POST') {
    if (request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') {
      return json({ success: false, error: 'Please submit from the booking page.' }, 403)
    }
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return json({ success: false, error: 'Expected JSON' }, 415)
    }
    if (Number(request.headers.get('content-length') || 0) > 65536) return json({ success: false, error: 'Request too large' }, 413)
    body = await request.text()
    if (new TextEncoder().encode(body).length > 65536) return json({ success: false, error: 'Request too large' }, 413)
    try {
      const data = JSON.parse(body)
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid data')
    } catch {
      return json({ success: false, error: 'Invalid request' }, 400)
    }
  }
  const headers = new Headers({ Accept: 'application/json', 'Content-Type': 'application/json', Origin: SITE_ORIGIN })
  // Preserve the existing service's per-visitor limit using the address supplied
  // by Cloudflare, never a caller's arbitrary forwarded/authentication headers.
  const clientIP = request.headers.get('cf-connecting-ip')
  if (clientIP) headers.set('x-forwarded-for', clientIP)
  try {
    const response = await upstreamFetch(`${BOOKING_ORIGIN}${url.pathname}`, {
      method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(20000),
    })
    if (response.status >= 300 && response.status < 400) {
      return json({ success: false, error: 'Booking is temporarily unavailable. Please try again.' }, 502)
    }
    if (!response.headers.get('content-type')?.includes('application/json')) {
      return json({ success: false, error: 'Booking is temporarily unavailable. Please try again.' }, 502)
    }
    const result = new Response(response.body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    })
    if (response.headers.has('retry-after')) result.headers.set('Retry-After', response.headers.get('retry-after'))
    return result
  } catch (error) {
    console.error('PSI booking connection failed', error instanceof Error ? error.message : 'Unknown connection error')
    // Do not retry a payment/booking POST: an uncertain response is not proof
    // that the upstream service did not already process it.
    return json({ success: false, error: 'Could not reach booking. Please try again or call (317) 620-3858.' }, 502)
  }
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname.startsWith('/api/')) return handleBookingRequest(request)
    return env.ASSETS.fetch(request)
  },
}
