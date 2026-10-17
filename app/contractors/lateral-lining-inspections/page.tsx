import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Phone, ArrowRight, CheckCircle2 } from 'lucide-react'
import content from '@/lib/contractors-content.json'
import { COMPANY_INFO } from '@/lib/constants'
import { T } from '@/components/diversity/diversity-provider'

const pagePath = '/contractors/lateral-lining-inspections'
const title = 'Lateral Lining Camera Inspections for Contractors | PSI'
const description = 'Pre- and post-lining camera inspections for contractors working in Citizens Energy Group’s service area. Call PSI at (317) 620-3858 to discuss your project.'
export const metadata: Metadata = {
  title: { absolute: title }, description,
  alternates: { canonical: pagePath },
  openGraph: { title, description, url: pagePath, images: [{ url: '/images/contractors/psi-contractors-hero.jpeg', width: 1536, height: 645, alt: 'PSI pre-lining video, post-lining video, and independent findings.' }] },
  twitter: { card: 'summary_large_image', title, description, images: ['/images/contractors/psi-contractors-hero.jpeg'] },
}

function Inline({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('**')
    ? <strong key={index}><T>{part.slice(2, -2)}</T></strong>
    : <T key={index}>{part}</T>)}</>
}

function ContactActions({ light = false }: { light?: boolean }) {
  return <div className="flex flex-col sm:flex-row gap-3 mt-6">
    <a href={`tel:${COMPANY_INFO.phoneRaw}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-700 hover:bg-orange-800 text-white px-5 py-3 font-semibold transition-colors"><Phone className="w-5 h-5 shrink-0" /><T>Call (317) 620-3858</T></a>
    <Link href="/contact" className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 font-semibold transition-colors ${light ? 'border-white/40 text-white hover:bg-white/10' : 'border-primary-200 text-primary-800 hover:bg-primary-50'}`}><T>Discuss your project</T><ArrowRight className="w-5 h-5 shrink-0" /></Link>
  </div>
}

function ContractorQuickGuide() {
  return <section className="bg-white py-12 md:py-16" aria-labelledby="contractor-quick-guide">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <h2 id="contractor-quick-guide" className="font-heading font-bold text-2xl md:text-3xl text-primary-900 mb-5"><T>Pre-lining and post-lining at a glance</T></h2>
      <p className="max-w-4xl text-gray-700 text-base md:text-lg leading-relaxed mb-8"><T>A sanitary sewer lateral carries wastewater from a property to the sewer. A camera inspection records the inside of that pipe. Plan the recording, site access, and submission responsibilities before lining starts.</T></p>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h3 className="text-xl font-bold text-primary-900 mb-3"><T>Before lining</T></h3>
          <p className="text-gray-700 leading-relaxed"><T>Document the existing pipe and visible issues. Confirm that every section being reused can be recorded, with footage measurements and views toward and away from the sanitary sewer.</T></p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h3 className="text-xl font-bold text-primary-900 mb-3"><T>After lining</T></h3>
          <p className="text-gray-700 leading-relaxed"><T>Record the accessible interior after installation. Review visible conditions and any inspection limits alongside the contractor’s installation records.</T></p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h3 className="text-xl font-bold text-primary-900 mb-3"><T>Who handles what</T></h3>
          <p className="text-gray-700 leading-relaxed"><T>PSI provides the agreed camera documentation and independent findings. Your project team handles the application, uploads, utility notifications, and inspection request. Citizens makes its review and acceptance decisions.</T></p>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
        <Link href="#contractor-preparation" className="font-semibold text-primary-700 underline underline-offset-4"><T>Review the preparation checklist</T></Link>
        <Link href="#contractor-questions" className="font-semibold text-primary-700 underline underline-offset-4"><T>Read contractor answers</T></Link>
        <Link href="/inspection-and-service" className="font-semibold text-primary-700 underline underline-offset-4"><T>How PSI and Indiana Drain Company work together</T></Link>
      </div>
    </div>
  </section>
}

function OfficialProjectResources() {
  return <section className="bg-gray-50 py-12 md:py-16" aria-labelledby="official-project-resources">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <h2 id="official-project-resources" className="font-heading font-bold text-2xl md:text-3xl text-primary-900 mb-5"><T>Official project resources</T></h2>
      <p className="max-w-4xl text-gray-700 leading-relaxed mb-5"><T>Keep these Citizens resources with your permit records and check them for project-specific instructions. The lateral-lining fact sheet is revised July 14, 2026; the links were checked October 10, 2026. Citizens’ requirements and review steps are separate from PSI’s inspection service.</T></p>
      <ul className="space-y-4 text-primary-700">
        <li><a className="font-semibold underline underline-offset-4" href="https://info.citizensenergygroup.com/hubfs/site/permits%20and%20forms%20documents/Sanitary-Sewer-Lateral-Lining-Fact-Sheet.pdf"><T>Citizens sanitary sewer lateral lining fact sheet (PDF)</T></a></li>
        <li><a className="font-semibold underline underline-offset-4" href="https://info.citizensenergygroup.com/permits-and-forms"><T>Citizens permits, applications, and lateral inspection requests</T></a></li>
        <li><a className="font-semibold underline underline-offset-4" href="https://info.citizensenergygroup.com/hubfs/site/permits%20and%20forms%20documents/2026%20Sanitary%20Standards%20Manual.pdf"><T>Citizens 2026 sanitary standards manual (PDF), section 404.06</T></a></li>
      </ul>
    </div>
  </section>
}

export default function ContractorsPage() {
  const [hero, ...sections] = content
  return <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <section className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 md:pt-20 pb-8">
          <p className="text-orange-300 font-semibold uppercase tracking-wider text-sm mb-4"><T>For lining contractors, plumbers & project teams</T></p>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl max-w-4xl leading-tight"><T>{hero.title}</T></h1>
          {hero.blocks.slice(0, 2).map((block, index) => <p key={index} className={`mt-5 max-w-3xl leading-relaxed ${index === 0 ? 'text-xl text-cyan-200 font-semibold' : 'text-lg text-primary-100'}`}><Inline text={block.text || ''} /></p>)}
          <ContactActions light />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
          <Link href="/contact" aria-label="Schedule a PSI inspection" className="block rounded-2xl overflow-hidden ring-1 ring-white/20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-orange-400">
            <Image src="/images/contractors/psi-contractors-hero.jpeg" width={1536} height={645} priority sizes="(max-width: 1280px) 100vw, 1280px" alt="Precision Sewer Inspections: pre-lining video, post-lining video, and independent findings for sewer lateral lining projects." className="w-full h-auto" />
          </Link>
        </div>
      </section>
      <ContractorQuickGuide />
      {sections.map((section, index) => {
        const faq = section.title === 'Frequently asked questions'
        const final = index === sections.length - 1
        return <section key={section.title} id={faq ? 'contractor-questions' : section.title === 'Contractor preparation checklist' ? 'contractor-preparation' : undefined} className={`${final ? 'bg-primary-900 text-white' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} py-12 md:py-16`}>
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 ${faq ? '' : 'lg:grid lg:grid-cols-[1fr_2fr] lg:gap-12'}`}>
            <div><h2 className={`font-heading font-bold text-2xl md:text-3xl mb-6 ${final ? 'text-white' : 'text-primary-900'}`}><T>{section.title}</T></h2>
              {index === 4 && <Image src="/images/contractors/psi-contractors-square.jpeg" width={1254} height={1254} sizes="(max-width: 1024px) 90vw, 400px" alt="PSI pre- and post-lining camera documentation: call (317) 620-3858." className="w-full max-w-sm h-auto rounded-xl mb-8" />}
              {final && <Image src="/images/contractors/psi-contractors-vertical.jpeg" width={864} height={1536} sizes="(max-width: 1024px) 80vw, 320px" alt="PSI camera inspections for lateral lining projects, pre-lining video, post-lining video, and independent documentation." className="w-full max-w-xs h-auto rounded-xl mb-8" />}
            </div>
            <div className={`space-y-5 ${final ? 'text-primary-100' : 'text-gray-700'} text-base md:text-lg leading-relaxed`}>
              {faq ? section.blocks.filter(block => block.kind === 'question').map((block) => {
                const position = section.blocks.indexOf(block)
                return <details key={block.text} className="group rounded-xl border border-gray-200 bg-white">
                  <summary className="cursor-pointer p-5 font-semibold text-primary-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"><T>{block.text || ''}</T></summary>
                  <p className="px-5 pb-5"><Inline text={section.blocks[position + 1]?.text || ''} /></p>
                </details>
              }) : section.blocks.map((block, blockIndex) => {
                if (block.kind === 'list') return <ul key={blockIndex} className={index === 0 ? 'grid sm:grid-cols-2 gap-5' : 'space-y-4'}>{block.items?.map(item => <li key={item} className={`flex gap-3 ${index === 0 ? 'rounded-xl border border-primary-100 p-5' : ''}`}><CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 mt-1" /><span><Inline text={item} /></span></li>)}</ul>
                if (block.kind === 'steps') return <ol key={blockIndex} className="list-decimal pl-6 space-y-5 marker:text-orange-600 marker:font-bold">{block.items?.map(item => <li key={item} className="pl-2"><Inline text={item} /></li>)}</ol>
                return <p key={blockIndex} className="whitespace-pre-line break-words"><Inline text={block.text || ''} /></p>
              })}
              {(final || index === 1 || index === 2) && <ContactActions light={final} />}
              {final && <a href={`mailto:${COMPANY_INFO.email}`} className="inline-block text-cyan-200 underline break-all">{COMPANY_INFO.email}</a>}
            </div>
          </div>
        </section>
      })}
      <OfficialProjectResources />
    </main>
    <Footer />
  </div>
}
