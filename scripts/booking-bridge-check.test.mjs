import test from 'node:test'
import assert from 'node:assert/strict'
import worker, { handleBookingRequest, BOOKING_ORIGIN } from '../sites/booking-worker.mjs'

const origin = 'https://precision-sewer-inspection-edits.captainphantasy.chatgpt.site'
function request(route, body, headers = {}) {
  return new Request(origin + route, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...headers }, body: JSON.stringify(body) })
}

test('availability uses the existing calendar service and is never cached', async () => {
  const availability = [{ date: '2026-09-26', slots: [{ start: '2026-09-26T11:00:00Z', available: false }] }]
  const result = await handleBookingRequest(new Request(origin + '/api/calendar/availability'), async (url, init) => {
    assert.equal(url, BOOKING_ORIGIN + '/api/calendar/availability')
    assert.equal(init.method, 'GET')
    assert.equal(init.redirect, 'manual')
    return Response.json({ success: true, availability })
  })
  assert.deepEqual((await result.json()).availability, availability)
  assert.equal(result.headers.get('cache-control'), 'no-store')
})

test('checkout retains contact, property, access, price selection and appointment data', async () => {
  const body = { customerEmail: 'qa@example.com', customerName: 'Preview Check', customerPhone: '3175550100', propertyAddress: '123 Test Street', serviceType: 'sewer-inspection', accessVerified: true, accessMethod: 'cleanout', occupancy: 'vacant', propertyAccess: 'Test access', cleanoutLocation: 'Test cleanout', appointmentStart: '2026-09-26T11:00:00Z', appointmentEnd: '2026-09-26T13:30:00Z', appointmentDisplay: '7:00 AM - 9:30 AM', appointmentDate: '2026-09-26', addOns: ['same-day'], promoCode: 'SAVE10' }
  const result = await handleBookingRequest(request('/api/stripe/checkout', body, { Cookie: 'private-cookie', Authorization: 'private-token', 'X-Forwarded-For': 'untrusted', 'CF-Connecting-IP': '192.0.2.1' }), async (url, init) => {
    assert.equal(url, BOOKING_ORIGIN + '/api/stripe/checkout')
    assert.deepEqual(JSON.parse(init.body), body)
    assert.equal(init.headers.get('origin'), origin)
    assert.equal(init.headers.get('authorization'), null)
    assert.equal(init.headers.get('cookie'), null)
    assert.equal(init.headers.get('x-forwarded-for'), '192.0.2.1')
    return Response.json({ url: 'https://checkout.stripe.com/c/pay/cs_test_fixture' })
  })
  assert.equal(result.status, 200)
  assert.equal((await result.json()).url, 'https://checkout.stripe.com/c/pay/cs_test_fixture')
})

test('confirmation uses the original service and preserves scheduling outcome', async () => {
  const result = await handleBookingRequest(request('/api/booking/confirm', { sessionId: 'cs_test_fixture' }), async (url, init) => {
    assert.equal(url, BOOKING_ORIGIN + '/api/booking/confirm')
    assert.deepEqual(JSON.parse(init.body), { sessionId: 'cs_test_fixture' })
    return Response.json({ success: true, calendarBooked: false, needsReschedule: true })
  })
  assert.equal((await result.json()).needsReschedule, true)
})

test('unsupported APIs, methods and cross-site writes never reach PSI', async () => {
  const noNetwork = () => { throw new Error('Unexpected network call') }
  assert.equal((await handleBookingRequest(request('/api/admin/users', {}), noNetwork)).status, 404)
  assert.equal((await handleBookingRequest(request('/api/calendar/availability', {}), noNetwork)).status, 405)
  assert.equal((await handleBookingRequest(request('/api/stripe/checkout', {}, { Origin: 'https://example.com' }), noNetwork)).status, 403)
  assert.equal((await handleBookingRequest(request('/api/stripe/checkout', {}, { 'Content-Type': 'text/plain' }), noNetwork)).status, 415)
  assert.equal((await handleBookingRequest(request('/api/stripe/checkout', []), noNetwork)).status, 400)
  assert.equal((await handleBookingRequest(request('/api/stripe/checkout', { text: 'x'.repeat(70000) }), noNetwork)).status, 413)
})

test('rate limits and upstream validation failures stay failures', async () => {
  const result = await handleBookingRequest(request('/api/leads/capture', {}), async () => Response.json({ error: 'Slow down' }, { status: 429, headers: { 'Retry-After': '60' } }))
  assert.equal(result.status, 429)
  assert.equal(result.headers.get('retry-after'), '60')
})

test('connection failures fail closed without retrying checkout', async () => {
  let calls = 0
  const result = await handleBookingRequest(request('/api/stripe/checkout', {}), async () => { calls++; throw new Error('Timeout') })
  assert.equal(result.status, 502)
  assert.equal((await result.json()).success, false)
  assert.equal(calls, 1)
})

test('unexpected HTML responses fail closed', async () => {
  const result = await handleBookingRequest(new Request(origin + '/api/calendar/availability'), async () => new Response('<html>Unavailable</html>', { headers: { 'Content-Type': 'text/html' } }))
  assert.equal(result.status, 502)
})

test('upstream redirects cannot forward booking details to another destination', async () => {
  const result = await handleBookingRequest(request('/api/stripe/checkout', {}), async () => Response.json({}, { status: 307, headers: { Location: 'https://example.com' } }))
  assert.equal(result.status, 502)
  assert.equal(result.headers.has('location'), false)
})

test('page requests go to the exported site assets', async () => {
  const result = await worker.fetch(new Request(origin + '/contact/'), { ASSETS: { fetch: async req => {
    assert.equal(new URL(req.url).pathname, '/contact/')
    return new Response('booking page')
  } } })
  assert.equal(await result.text(), 'booking page')
})
