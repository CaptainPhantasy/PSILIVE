export const PROMO_CODE = 'SAVE10'
export const PROMO_PERCENT = 10
export const STRIPE_PROMO_COUPON_ID = 'SAVE10_PERCENT'

export type ServiceType = 'sewer-inspection' | 'sewer-inspection-toilet' | 'sewer-inspection-roof'
export type AccessMethod = 'cleanout' | 'toilet-pull' | 'roof-vent'
export type AddOnId = 'same-day' | 'crawl-space' | 'cleanout-cap' | 'additional-cleanout'

export const SERVICE_OPTIONS: Array<{
  value: ServiceType
  accessMethod: AccessMethod
  label: string
  amountCents: number
  description: string
}> = [
  {
    value: 'sewer-inspection',
    accessMethod: 'cleanout',
    label: 'Sewer Scope w/ HD Video',
    amountCents: 15900,
    description: 'Standard cleanout access',
  },
  {
    value: 'sewer-inspection-toilet',
    accessMethod: 'toilet-pull',
    label: 'Sewer Scope — Toilet Pull Access',
    amountCents: 22400,
    description: '+$65 includes toilet pull/reset, new wax ring, and supply line',
  },
  {
    value: 'sewer-inspection-roof',
    accessMethod: 'roof-vent',
    label: 'Sewer Scope — Roof Vent Access',
    amountCents: 20900,
    description: '+$50 via plumbing vent pipe',
  },
]

export const ADD_ON_OPTIONS: Array<{
  id: AddOnId
  label: string
  amountCents: number
  description: string
}> = [
  {
    id: 'same-day',
    label: 'Same-Day Report Delivery',
    amountCents: 3900,
    description: 'Expedited report delivery on the same day of inspection',
  },
  {
    id: 'crawl-space',
    label: 'Crawl Space Access',
    amountCents: 3000,
    description: 'Additional fee for crawl space entry',
  },
  {
    id: 'cleanout-cap',
    label: 'Clean-Out Cap Replacement',
    amountCents: 5000,
    description: 'Cut out and replace damaged or inaccessible cleanout cap',
  },
  {
    id: 'additional-cleanout',
    label: 'Additional Cleanout Inspection',
    amountCents: 12900,
    description: 'Additional cleanout inspection on the same visit',
  },
]

export function normalizePromoCode(code?: string | null) {
  return code?.trim().toUpperCase() || ''
}

export function isPromoCodeValid(code?: string | null) {
  return normalizePromoCode(code) === PROMO_CODE
}

export function getServiceOption(serviceType: string | undefined | null) {
  return SERVICE_OPTIONS.find((service) => service.value === serviceType) || SERVICE_OPTIONS[0]
}

export function getServiceTypeForAccessMethod(accessMethod: string | undefined | null): ServiceType {
  return SERVICE_OPTIONS.find((service) => service.accessMethod === accessMethod)?.value || SERVICE_OPTIONS[0].value
}

export function getAccessMethodForServiceType(serviceType: string | undefined | null): AccessMethod {
  return getServiceOption(serviceType).accessMethod
}

export function getAddOnOption(addOnId: string) {
  return ADD_ON_OPTIONS.find((addOn) => addOn.id === addOnId)
}

export function normalizeAddOns(addOns: unknown): AddOnId[] {
  if (!Array.isArray(addOns)) return []

  return ADD_ON_OPTIONS
    .map((addOn) => addOn.id)
    .filter((addOnId) => addOns.includes(addOnId))
}

export function calculateCheckoutPricing(serviceType: string, addOns: readonly string[], promoCode?: string | null) {
  const service = getServiceOption(serviceType)
  const addOnItems = normalizeAddOns(addOns)
    .map(getAddOnOption)
    .filter((addOn): addOn is NonNullable<ReturnType<typeof getAddOnOption>> => Boolean(addOn))

  const addOnsTotalCents = addOnItems.reduce((total, addOn) => total + addOn.amountCents, 0)
  const subtotalCents = service.amountCents + addOnsTotalCents
  const promoApplied = isPromoCodeValid(promoCode)
  const discountCents = promoApplied ? Math.round((subtotalCents * PROMO_PERCENT) / 100) : 0
  const totalCents = Math.max(subtotalCents - discountCents, 0)

  return {
    service,
    addOnItems,
    addOnsTotalCents,
    subtotalCents,
    discountCents,
    totalCents,
    promoApplied,
  }
}

export function formatCents(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`
}
