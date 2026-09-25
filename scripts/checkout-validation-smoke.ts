/**
 * Smoke check for the checkout route validation layer (ported from codex/checkout-hardening).
 * Imports the route logic directly with dummy env so Stripe/DB calls fail closed.
 * Run: npx tsx scripts/checkout-validation-smoke.ts
 */

// Dummy env BEFORE importing the route: Stripe/Prisma must construct but never succeed.
process.env.STRIPE_SECRET_KEY = 'sk_test_smoke_invalid_key'
process.env.DATABASE_URL = 'postgresql://smoke:smoke@127.0.0.1:1/smoke'

async function main() {
  const { NextRequest } = await import('next/server')
  const { POST } = await import('../app/api/stripe/checkout/route')

  const post = (payload: unknown) =>
    POST(
      new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    )

  const validPayload = {
    customerEmail: 'smoke@example.com',
    customerName: 'Smoke Test',
    customerPhone: '(317) 555-1234',
    propertyAddress: '123 Main St, Indianapolis, Indiana 46227',
    accessVerified: true,
    serviceType: 'sewer-inspection',
    accessMethod: 'cleanout',
    addOns: [],
    appointmentStart: '2026-08-10T14:00:00.000Z',
    appointmentEnd: '2026-08-10T15:00:00.000Z',
    appointmentDisplay: '9:00 AM',
    appointmentDate: '2026-08-10',
    occupancy: 'vacant',
    propertyAccess: 'Lockbox 1234',
    cleanoutLocation: 'Front yard',
    propertyCity: 'Indianapolis',
    propertyState: 'Indiana',
    propertyZip: '46227',
  }

  // (a) malformed email
  const resA = await post({ ...validPayload, customerEmail: 'not-an-email' })
  const bodyA = await resA.json()
  console.log(`(a) malformed email        -> ${resA.status}`, JSON.stringify(bodyA))

  // (b) wrong payload type (array instead of object)
  const resB = await post(['not', 'an', 'object'])
  const bodyB = await resB.json()
  console.log(`(b) wrong payload type     -> ${resB.status}`, JSON.stringify(bodyB))

  // (c) valid payload — validation must pass; Stripe then fails closed with dummy key (non-400)
  const resC = await post(validPayload)
  const bodyC = await resC.json()
  console.log(`(c) valid payload          -> ${resC.status}`, JSON.stringify(bodyC))

  const pass = resA.status === 400 && resB.status === 400 && resC.status !== 400
  console.log(pass ? 'SMOKE RESULT: PASS (400 / 400 / non-400)' : 'SMOKE RESULT: FAIL')
  process.exit(pass ? 0 : 1)
}

main().catch((err) => {
  console.error('SMOKE RESULT: ERROR', err)
  process.exit(1)
})
