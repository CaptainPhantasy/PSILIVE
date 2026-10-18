// Verified against Google Business Profile notifications on October 9, 2026.
// Notification dates are not treated as review dates. No aggregate rating or
// total Google review count is inferred from this selection.
export type GoogleReview = {
  author: string
  rating: number
  quote?: string
  excerpt?: boolean
}

export const GOOGLE_REVIEWS_URL = 'https://www.google.com/search?q=precision+sewer+inspecitomn'

export const GOOGLE_REVIEWS: GoogleReview[] = [
  {
    author: 'Erin Thompson',
    rating: 5,
    quote: 'I had a great experience with Ryan and his team. Super knowledgeable and very friendly.',
    excerpt: true,
  },
  {
    author: 'James Perry',
    rating: 5,
    quote: 'Great dude. Used him on a few jobs I won’t use anyone else',
  },
  {
    author: 'Julie Haydon',
    rating: 5,
    quote: 'Ryan was so helpful inspecting my sewer line to confirm everything was in good shape.',
    excerpt: true,
  },
  {
    author: 'Colton Haymon',
    rating: 5,
    quote: 'Professional, timely, and pleasant to work with!',
  },
  {
    author: 'Gary Powell',
    rating: 5,
    quote: 'Ryan is very knowledgeable and very punctual, pleasure to work with.',
    excerpt: true,
  },
  {
    author: 'Priscilla Hurn',
    rating: 5,
    quote: 'I had two sewer scopes done on two different properties. Both times the customer service was great!',
    excerpt: true,
  },
  {
    author: 'George Reavis',
    rating: 5,
    quote: 'Great company. Ryan was very knowledgeable feel like he went over and above to explain things.',
    excerpt: true,
  },
  {
    author: 'Tristan Knox',
    rating: 5,
    quote: 'I’ve had the crew out to scope and jet multiple sewer lines for me.',
    excerpt: true,
  },
  {
    author: 'Jeremy Duncan',
    rating: 5,
    quote: 'Have worked with Precision Sewer Inspection recently. Service was great.',
    excerpt: true,
  },
  {
    author: 'James Krause',
    rating: 5,
    quote: 'Ryan was extremely knowledgeable and quick to help us with our sewer line needs!',
    excerpt: true,
  },
  {
    author: 'michelle lyday',
    rating: 5,
    quote: 'Had some communication issues, but the owner called, resolved my concerns…',
    excerpt: true,
  },
  {
    author: 'sheldon mudd',
    rating: 5,
  },
]
