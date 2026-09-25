'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { SERVICE_AREAS } from '@/lib/constants'
import { SERVICE_AREA_LINKS } from '@/lib/service-areas'
import { T } from '@/components/diversity/diversity-provider'

export default function ServiceAreas() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="psi dark" data-screen-label="Service Areas">
      <div className="container" style={{ textAlign: 'center' }}>

        <h2 className="psi" style={{ border: 'none', padding: 0, marginBottom: '1rem' }}>
          <T>Serving Central Indiana</T>
        </h2>
        <p className="lede" style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
          <T>We provide professional sewer inspection services throughout Central Indiana.</T>
        </p>

        <div ref={ref} className="areas-chips">
          {SERVICE_AREAS?.map((area, index) => {
            // Only canonical slugs (lib/service-areas.ts) have live pages; other
            // cities render as plain chips so no chip ever 404s.
            const link = SERVICE_AREA_LINKS.find((l) => l.name === area)
            const inner = (
              <motion.span
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.05 }}
              >
                {area ?? ''}
              </motion.span>
            )
            return link ? (
              <Link
                key={area ?? index}
                href={`/sewer-inspection/${link.slug}`}
                className="area-chip"
                style={{ textDecoration: 'none' }}
              >
                {inner}
              </Link>
            ) : (
              <span key={area ?? index} className="area-chip">{inner}</span>
            )
          })}
        </div>

        <p className="areas-foot">
          <T>Share your full address so we can confirm service suitability and appointment availability.</T>
        </p>

      </div>
    </section>
  )
}
