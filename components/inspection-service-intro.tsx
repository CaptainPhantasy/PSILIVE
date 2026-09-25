import Link from 'next/link'
import { T } from '@/components/diversity/diversity-provider'
import { IDC_URL } from '@/lib/inspection-and-service'

export default function InspectionServiceIntro() {
  return (
    <section className="section-padding bg-gray-50" aria-labelledby="connected-care-title">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <span className="eyebrow"><T>PSI + Indiana Drain Company</T></span>
        <h2 id="connected-care-title" className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-6">
          <T>Same honest team. More ways to help.</T>
        </h2>
        <div className="grid md:grid-cols-2 gap-6 text-lg text-gray-600">
          <p><T>An inspection gives you the information to make a decision. Sometimes that is all you need. Sometimes you want help putting that information to work.</T></p>
          <p><T>PSI and Indiana Drain Company are affiliated companies under shared ownership. PSI inspects, investigates, locates, documents and explains. IDC clears, cleans, maintains, exposes and repairs within the agreed scope.</T></p>
        </div>
        <p className="text-xl font-semibold text-primary-800 mt-6"><T>Your findings reflect observed conditions whether you choose IDC, another provider or no further work.</T></p>
        <div className="flex flex-wrap gap-4 mt-6">
          <Link href="/inspection-and-service" className="btn-primary"><T>How Inspection &amp; Service Work Together</T></Link>
          <a href={IDC_URL} className="btn-secondary"><T>Cleaning or repair: visit Indiana Drain Company</T></a>
        </div>
      </div>
    </section>
  )
}
