import { PROMO_CODE, PROMO_PERCENT } from './checkout-pricing'
import { INSPECTION_SERVICE_FAQ, CLEANING_FAQ } from './inspection-and-service'
export const COMPANY_INFO = {
  name: 'Precision Sewer Inspections',
  phone: '(317) 620-3858',
  phoneRaw: '3176203858',
  email: 'booking@precisionsewerinspections.com',
  address: '6405 Justins Ridge Road',
  city: 'Nashville',
  state: 'IN',
  zip: '47448',
  fullAddress: '6405 Justins Ridge Road, Nashville, IN 47448',
  serviceArea: 'Central Indiana',
  serviceAreaDisplay: 'Indianapolis Metro & Surrounding Areas',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Indianapolis+IN+sewer+inspection',
}

export const SERVICES = [
  {
    id: 'sewer-scope',
    title: 'Sewer Scope Inspection',
    description: 'HD video inspection of your main sewer line from cleanout to city connection. Premium reporting with transparent, upfront pricing.',
    price: 'From $159',
    features: ['HD Video Recording', 'Premium Written Report', 'One-Business-Day Delivery'],
  },
  {
    id: 'commercial',
    title: 'Commercial & Multi-Unit',
    description: 'Comprehensive inspections for commercial properties, multi-family buildings, and property managers with volume pricing.',
    price: 'Custom Quote',
    features: ['Multi-Unit Pricing', 'Volume Discounts', 'Detailed Documentation'],
  },
  {
    id: 'real-estate',
    title: 'Brokerage & Investor Packages',
    description: 'Prepaid volume packages for real estate professionals with priority scheduling and cost savings.',
    price: 'Volume Pricing',
    features: ['Priority Scheduling', 'Prepaid Discounts', 'Dedicated Support'],
  },
]

export const PRICING_TIERS = [
  {
    name: 'Standard Sewer Scope',
    price: '$159',
    description: 'Clear, Upfront Pricing',
    features: [
      'HD Video Recording',
      'HD images and factual summary with no jargon',
      'One-Business-Day Delivery',
      'Standard Cleanout Access',
      'Phone Consultation',
      'Additional Work Only With Your Approval',
    ],
    cta: 'Book Now',
    featured: false,
    isPromo: false,
  },
  {
    name: 'Standard',
    price: '$159',
    description: 'Regular Pricing',
    features: [
      'HD Video Recording',
      'HD images and factual summary with no jargon',
      'One-Business-Day Delivery',
      'Standard Cleanout Access',
      'Phone Consultation',
      'Additional Work Only With Your Approval',
    ],
    cta: 'Book Now',
    featured: true,
  },
  {
    name: 'Volume Packages',
    price: 'Custom',
    description: 'Brokerages & Investors',
    features: [
      '10+ Scope Prepaid Bundles',
      'Per-Scope Discounts',
      'Priority Scheduling',
      'Dedicated Account Support',
      'Annual Package Options',
    ],
    cta: 'Get Quote',
    featured: false,
  },
]

export const ACCESS_METHODS = [
  { method: 'Standard Cleanout Access', price: 'Included', description: 'Outdoor or indoor cleanout — fastest access method' },
  { method: 'Multiple Cleanouts', price: '1st: $159 / Additional: $129', description: 'Additional cleanout inspections performed on-site' },
  { method: 'Roof Vent Access', price: '+$50', description: 'Camera entry via plumbing vent on roof' },
  { method: 'Toilet Pull & Reset', price: '+$65', description: 'Includes new wax ring and supply line — replacement included in the access charge' },
  { method: 'Clean-Out Cap Replacement', price: '+$50', description: 'Cut out and replace damaged or inaccessible cleanout cap' },
  { method: 'Crawl Space Access', price: '+$30', description: 'Additional fee for crawl space entry' },
  { method: 'Trip Fee', price: '$79', description: 'Charged on a case-by-case basis when access to the sewer system is unavailable, incorrect information was provided, or no one is home at the scheduled time' },
]

export const MULTI_UNIT_PRICING = [
  { units: 'First Unit', price: '$159', description: 'Standard inspection rate' },
  { units: 'Each Additional Unit', price: '$129', description: 'When using the same access point' },
]

export const VOLUME_PACKAGES = [
  { 
    name: '10-Scope Bundle', 
    price: '$135/scope', 
    description: 'Prepaid package with discounted per-scope rate',
    features: ['~15% savings', 'Priority scheduling', 'On time findings']
  },
  { 
    name: '25-Scope Brokerage', 
    price: 'Call for Pricing', 
    description: 'Ideal for active real estate teams',
    features: ['Per-scope discounts', 'Dedicated support', 'On time findings']
  },
  { 
    name: 'Enterprise', 
    price: 'Call for Pricing', 
    description: 'For high-volume investors (400-600+ scopes/year)',
    features: ['Best per-scope rates', 'Priority service', 'Account manager']
  },
]

export const PIPE_ISSUES = [
  { name: 'Root Intrusion', image: '/images/root_intrusion.jpg', description: 'Tree roots growing into pipes' },
  { name: 'Cracks & Breaks', image: '/images/cracked_pipe.jpg', description: 'Structural damage to pipes' },
  { name: 'Belly/Sag', image: '/images/pipe_bellying.png', description: 'Low spots where waste collects' },
  { name: 'Blockages', image: '/images/blockage.jpg', description: 'Debris blocking flow' },
  { name: 'Scale Buildup', image: '/images/scale_buildup.png', description: 'Mineral deposits reducing flow' },
  { name: 'Offset Joints', image: '/images/offset_joint.png', description: 'Misaligned pipe connections' },
]

// Real, customer-approved testimonials ONLY. Empty until verified quotes are
// added — the Testimonials section and the review schema both stay hidden while
// this is empty, so nothing fabricated is ever shown to users or to Google.
// Shape for each entry: { quote: string, author: string, role: string, rating: number }
export const TESTIMONIALS: { quote: string; author: string; role: string; rating: number }[] = [
  {
    // Real, customer-approved testimonial — customer consented to a public review.
    // Full identity verified internally; only first name + initial is shown publicly.
    quote:
      "This is an incredibly thorough report. Thank you for all your hard work — I'll be glad to share your contact with my investor community in Indianapolis!",
    author: 'Andrew L.',
    role: 'Real Estate Investor · Greenwood, IN',
    rating: 5,
  },
]
export const CONVERSATIONAL_FAQS = [
  {
    question: 'Should I get a sewer scope on an older home in Indianapolis?',
    answer: "Yes—especially in Central Indiana, where many older homes still have clay tile or cast iron lines that deteriorate over decades. A $159 scope documents the visible condition before you're responsible for it.",
  },
  {
    question: 'How long does a sewer scope inspection take?',
    answer: 'Most inspections take 30-60 minutes on-site. Your HD video and written report arrive within one business day, with same-day delivery available if you are on a deadline.',
  },
  {
    question: 'What does a sewer camera inspection show?',
    answer: 'The camera shows the inside of your sewer line in HD: roots, cracks, bellies, offsets, corrosion, and blockages, with footage-counter references where useful. Distance readings are approximate and do not establish a surveyed location. We explain what the recording supports and what remains uncertain.',
  },
  {
    question: 'How much does a sewer scope inspection cost in Indiana?',
    answer: 'Our standard inspection is $159 with cleanout access, including HD video and a written report within one business day. Alternate access methods cost a bit more (roof vent +$50, toilet pull +$65, crawl space +$30), and we confirm all pricing before work begins.',
  },
  {
    question: 'How to tell if a sewer line has tree roots?',
    answer: 'Recurring slow drains, gurgling, and backups that return after clearing are the usual signs—especially in yards with mature trees. A camera may show roots where the view is clear. These symptoms alone do not establish the cause, and an obstruction can prevent a complete view.',
  },
  {
    question: 'Does a standard home inspection cover the sewer line?',
    answer: "A standard home inspection typically excludes a sewer-camera scope. Some home inspectors offer it as an additional service. Confirm what is included before booking.",
  },
]

export const FAQ_ITEMS = [
  { question: 'What is included when part of the line cannot be inspected?', answer: 'You receive the recording and findings for the accessible sections, with the stopping point and limitation explained. We do not describe an unseen section as clear. Alternate access or cleaning is discussed and priced separately; you decide whether to proceed.' },
  { question: 'Is a locate or route sketch an engineered map?', answer: 'No. Surface marks and a basic route sketch show an approximate trace where a usable signal and access permit. Footage and depth readings are estimates. They do not replace a survey, engineering design or required utility notification before digging.' },
  { question: 'Can I use an existing inspection for a service quote?', answer: 'Yes, tell us the previous job reference or that you have a report. We review whether it answers the current question before proposing another inspection. Changed conditions, missing sections or unsuitable footage can make new inspection work necessary.' },
  INSPECTION_SERVICE_FAQ,
  CLEANING_FAQ,
  {
    question: 'How much does a sewer scope cost in Indiana?',
    answer: 'Our standard sewer scope inspection is $159 with cleanout access, which includes HD video recording and a written report delivered within one business day. Additional fees may apply for alternative access methods: +$50 for roof vent access, +$65 for toilet pull (includes new wax ring and supply line), +$30 for crawl space access. We believe in transparent, upfront pricing—no hidden fees.',
  },
  {
    question: 'What if access requires a toilet pull?',
    answer: "Toilet pull access is $65 additional. This includes removing and reinstalling the toilet with a brand new wax ring and supply line. A new supply line is included in this access charge. We'll confirm the access method and pricing before beginning work.",
  },
  {
    question: "What happens if no one is home or access isn't available?",
    answer: 'A $79 trip fee may be charged on a case-by-case basis. This typically applies when access to the sewer system is unavailable, incorrect information was provided about the property, or no one is home at the scheduled time. To avoid this fee, please ensure someone is available and verify access to the clean-out before your appointment.',
  },
  {
    question: 'What about multiple cleanouts on a property?',
    answer: 'If additional cleanouts need to be inspected on the same visit, the first cleanout is $159 and each additional cleanout is $129. This allows us to provide comprehensive coverage of larger or more complex sewer systems at a reduced rate.',
  },
  {
    question: 'Do you offer bulk pricing for investors or brokerages?',
    answer: 'Yes! We offer prepaid volume packages designed for real estate professionals and investors. Our 10-scope bundles and 25-scope brokerage packages include per-scope discounts and priority scheduling. Contact us for custom volume pricing.',
  },
  {
    question: 'How do volume packages work?',
    answer: 'Volume packages are prepaid bundles purchased upfront at a discounted per-scope rate. You receive priority scheduling and dedicated support. Packages can be used across multiple properties. The more you purchase, the greater your savings.',
  },
  {
    question: 'How long does an inspection take?',
    answer: "Most inspections are completed in 30-60 minutes on-site. You'll receive your video and premium written report within one business day, or same-day for an additional fee if you're under a tight deadline.",
  },
  {
    question: 'What equipment do you use?',
    answer: "We run three professional camera scope systems, matched to the job. Our high-end system carries an electronic locator and sonde transmitter — that lets us estimate the camera's underground location and depth from the surface. Every system records high-definition video for your report.",
  },
  {
    question: 'Do you offer hydro jetting?',
    answer: 'Yes. If an obstruction limits inspection access, we explain whether cleaning or hydro jetting could help, quote it separately, and proceed only with your approval. Our sister company, Indiana Drain Company, also offers standalone cleaning and jetting. If cleaning is declined, we document the accessible sections and the limitation.',
  },
]

export const SERVICE_AREAS = [
  'Indianapolis', 'Carmel', 'Fishers', 'Noblesville', 'Westfield',
  'Zionsville', 'Brownsburg', 'Avon', 'Plainfield', 'Greenwood',
  'Franklin', 'Greenfield', 'Geist',
]

type DiscountType = 'fixed' | 'percent'

export const ACTIVE_PROMOTIONS: Array<{
  code: string
  description: string
  discountAmount: number
  discountType: DiscountType
  appliesTo: string
  bannerText: string
  isActive: boolean
}> = [
  {
    code: PROMO_CODE,
    description: '10% off your first sewer inspection',
    discountAmount: PROMO_PERCENT,
    discountType: 'percent',
    appliesTo: 'sewer-inspection',
    bannerText: 'Click the banner at the top of any page to claim!',
    isActive: true,
  },
]

// Helper to get current active promotion (returns first active one or null)
export const getActivePromotion = () => {
  const promo = ACTIVE_PROMOTIONS.find(p => p.isActive)
  return promo || null
}
