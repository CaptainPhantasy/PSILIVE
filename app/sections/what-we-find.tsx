'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useInView } from 'react-intersection-observer'
import { AlertTriangle } from 'lucide-react'
import SectionHeading from '@/components/section-heading'
import { PIPE_ISSUES } from '@/lib/constants'
import { T, useDiversity } from '@/components/diversity/diversity-provider'

export default function WhatWeFind() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const { t } = useDiversity()

  return (
    <section id="what-we-find" className="psi alt">
      <div className="container">
        <SectionHeading
          label="What We Find"
          title="Conditions a camera may reveal"
          description="A camera inspection can document these conditions where visible. We also report clear sections and explain anything that limits the view."
          icon={AlertTriangle}
        />

        <div ref={ref} className="pipes-grid">
          {PIPE_ISSUES?.map((issue, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="pipe"
            >
              {issue.image.endsWith(".png") && <div className="still">
                <Image
                  src={issue.image}
                  alt={t(issue.description)}
                  fill
                  sizes="(max-width: 560px) 50vw, (max-width: 1000px) 33vw, 17vw"
                  className="object-cover"
                />
              </div>}
              <div className="p-3 bg-primary-50 flex items-center">
                <p className="text-primary-900 text-base"><T>{issue.description}</T></p>
              </div>
              <div className="label-row">
                <h3 className="nm">
                  <T>{issue?.name ?? ''}</T>
                </h3>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
