'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Calendar, Camera, Video, CheckCircle, ArrowRight } from 'lucide-react'
import { T } from '@/components/diversity/diversity-provider'

const steps = [
  { step: '1', title: 'Choose your inspection', description: 'Select your access method and tell us how to reach the property. Review the price before you pay.' },
  { step: '2', title: 'Pick a time and pay online', description: 'Choose an available appointment from our live calendar, enter your contact and property details, then pay securely through Stripe.' },
  { step: '3', title: 'Get your video and report', description: 'PSI inspects the accessible line and documents the findings and limitations. Your video and written report arrive within one business day.' },
  { step: '4', title: 'Choose your next step', description: 'If you ask for service options, our sister company IDC may be able to help. Additional work is priced and approved separately. You choose the provider.' },
]


export default function HowItWorks() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="psi alt" data-screen-label="How It Works">
      <div className="container">
        
        {/* Replaced old SectionHeading with the exact design system DOM structure */}
        <div className="section-head">
          <span className="eyebrow"><T>How It Works</T></span>
          <h2 className="psi"><span className="rule"></span><T>From your question to documented findings</T></h2>
          <p className="lede"><T>Book and pay online. Get clear findings. Decide what happens next.</T></p>
        </div>

        <div ref={ref} className="steps-wrap">
          {/* Connector line exactly as specified in the CSS */}
          <div className="connector"></div>

          <div className="steps">
            {steps?.map((step, index) => {
              // Extracting icon to prevent unused variable warnings, though UI now uses typography lockup
              // Steps are numbered in reading order.
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.15 }}
                  className="step"
                >
                  <div className="num-block">
                    <span className="stepN"><T>{`Step 0${step?.step ?? index + 1}`}</T></span>
                    {step?.step ?? index + 1}
                  </div>
                  
                  <h3><T>{step?.title ?? ''}</T></h3>
                  <p><T>{step?.description ?? ''}</T></p>
                </motion.div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}
