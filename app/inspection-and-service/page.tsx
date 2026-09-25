import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import StructuredData from '@/components/structured-data'
import { T } from '@/components/diversity/diversity-provider'
import FindingsExplained from '@/components/findings-explained'
import { IDC_URL, INSPECTION_SERVICE_FAQ, CLEANING_FAQ } from '@/lib/inspection-and-service'

export const metadata: Metadata = {
  title: 'Inspection & Service | PSI + Indiana Drain Company',
  description: 'Clear PSI inspection findings, with optional cleaning, maintenance and repair services through our sister company, Indiana Drain Company. You choose the next step.',
  alternates: { canonical: '/inspection-and-service' },
}

const questions = [
  INSPECTION_SERVICE_FAQ,
  CLEANING_FAQ,
  { question: 'Do I need a second inspection to get an IDC quote?', answer: 'Tell the shared team you already have an inspection and give the job reference. With your permission, an existing recording or report may support a service quote. New inspection work is discussed only when conditions have changed or the earlier information does not answer the current question. One request is enough to start; involving both companies does not automatically require two forms or two appointments.' },
  { question: 'Will my inspection turn into a repair sales discussion?', answer: 'PSI explains the findings and limitations first. We do not initiate a repair consultation. When you ask for recommendations, we can discuss practical options, including IDC services where appropriate. Any additional work has its own scope, price, and approval.' },
  { question: 'Can I still get a free second opinion?', answer: 'Yes. PSI reviews another company’s sewer-camera video at no charge. We explain what the footage shows and what cannot be confirmed. No inspection or service purchase is required. Next-step recommendations are available when you ask.' },
  { question: 'How do pump inspections and cleaning work?', answer: 'PSI inspects accessible pump systems after confirming the system type, access, condition, and safe testing scope. Cleaning is needed before many pump inspections; the reason and price are explained first. IDC also offers preventive pump and basin cleaning as a separate service. Contact us to confirm suitability and availability.' },
]

export default function InspectionAndServicePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <StructuredData type="FAQPage" faqs={questions} />
      <main className="flex-1">
        <section className="bg-primary-900 text-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <p className="text-primary-200 font-semibold mb-4"><T>One local team. Two focused brands.</T></p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6"><T>Clear answers. A clearer way forward.</T></h1>
            <p className="text-xl text-primary-200"><T>Precision Sewer Inspections and Indiana Drain Company are sister companies under shared ownership. Together, we connect careful inspection and clear reporting with practical help when you want it.</T></p>
          </div>
        </section>
        <section className="section-padding bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-8">
            <article className="rounded-2xl bg-gray-50 p-8">
              <h2 className="text-2xl font-heading font-bold mb-4"><T>Start with PSI for clear findings.</T></h2>
              <p className="text-gray-600 mb-6"><T>Residential and commercial drain and sewer inspections, household and pool pump inspections, and other ordinary liquid lines within our equipment and expertise. PSI also offers separately approved hydro jetting, written reports, and free video second opinions. We explain what we observe and what we cannot confirm. Highly specialized systems require a suitable specialist.</T></p>
              <Link href="/contact" className="btn-primary"><T>Book an Inspection</T></Link>
            </article>
            <article className="rounded-2xl bg-gray-50 p-8">
              <h2 className="text-2xl font-heading font-bold mb-4"><T>Turn to IDC for the next step.</T></h2>
              <p className="text-gray-600 mb-6"><T>Indiana Drain Company is the service arm of our shared team: drain cleaning, hydro jetting, pump cleaning, maintenance, and qualifying repair work. IDC confirms the service, location, access requirements, and price before you authorize work. A recommendation depends on your needs, not our shared ownership.</T></p>
              <a href={IDC_URL} className="btn-primary"><T>View Indiana Drain Company services</T></a>
            </article>
          </div>
        </section>
        <FindingsExplained />
        <section className="section-padding bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-heading font-bold mb-8"><T>Your findings. Your choice.</T></h2>
            <div className="space-y-8">
              {questions.map((question) => (
                <article key={question.question}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3"><T>{question.question}</T></h3>
                  <p className="text-gray-600"><T>{question.answer}</T></p>
                </article>
              ))}
            </div>
            <Link href="/video-review" className="btn-primary mt-8"><T>Get a Free Video Second Opinion</T></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
