'use client'

import { useState } from 'react'
import { TESTIMONIALS } from '@/lib/constants'
import { GOOGLE_REVIEWS, GOOGLE_REVIEWS_URL } from '@/lib/google-reviews'
import { T } from '@/components/diversity/diversity-provider'

export default function Testimonials() {
  const [showAll, setShowAll] = useState(false)
  const visibleReviews = showAll ? GOOGLE_REVIEWS : GOOGLE_REVIEWS.slice(0, 6)

  if (GOOGLE_REVIEWS.length === 0 && TESTIMONIALS.length === 0) return null

  return (
    <section id="reviews" className="psi alt" data-screen-label="Testimonials">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><T>Google Reviews</T></span>
          <h2 className="psi"><span className="rule"></span><T>What Our Customers Say</T></h2>
          <p className="lede"><T>Customer feedback on inspection, communication, and service.</T></p>
        </div>

        <div id="google-review-grid" className="testimonial-grid">
          {visibleReviews.map((review) => (
            <article key={review.author} className="testimonial">
              <div className="stars" role="img" aria-label={`${review.rating} out of 5 stars`}>
                <span aria-hidden="true">{Array.from({ length: review.rating }).map(() => '★').join(' ')}</span>
              </div>
              {review.quote ? (
                <blockquote>&quot;{review.quote}&quot;</blockquote>
              ) : (
                <p className="review-meta text-sm"><T>Rating only</T></p>
              )}
              <div className="who">
                <div className="name">{review.author}</div>
                <div className="role">
                  <T>{review.excerpt ? 'Google review · Excerpt' : review.quote ? 'Google review' : 'Google rating'}</T>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          {GOOGLE_REVIEWS.length > 6 && (
            <button
              type="button"
              className="review-toggle rounded-lg border px-5 py-3 text-sm font-semibold"
              aria-expanded={showAll}
              aria-controls="google-review-grid"
              onClick={() => setShowAll((current) => !current)}
            >
              <T>{showAll ? 'Show fewer Google reviews' : 'Show more Google reviews'}</T>
            </button>
          )}
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="review-link text-sm font-semibold underline underline-offset-4"
          >
            <T>Find PSI on Google</T> <span aria-hidden="true">↗</span>
            <span className="sr-only"><T> (opens in a new tab)</T></span>
          </a>
        </div>

        {TESTIMONIALS.length > 0 && (
          <div className="mt-10">
            <h3 className="review-heading mb-4 text-lg font-semibold"><T>More Customer Feedback</T></h3>
            <div className="testimonial-grid">
              {TESTIMONIALS.map((testimonial) => (
                <article key={testimonial.author} className="testimonial">
                  <div className="stars" role="img" aria-label={`${testimonial.rating} out of 5 stars`}>
                    <span aria-hidden="true">{Array.from({ length: testimonial.rating }).map(() => '★').join(' ')}</span>
                  </div>
                  <blockquote>&quot;{testimonial.quote}&quot;</blockquote>
                  <div className="who">
                    <div className="name">{testimonial.author}</div>
                    <div className="role"><T>{testimonial.role}</T></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
