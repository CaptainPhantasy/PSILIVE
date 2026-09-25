import Link from 'next/link'

const paths = [
  { title: 'Buying or evaluating a property?', text: 'Document the visible sewer condition before a purchase, sale or property decision. Keep the recording and written findings.', href: '/services#residential', action: 'Property inspections' },
  { title: 'The same sewer problem keeps returning?', text: 'Investigate what is visible, where the camera stops and what still needs checking. Clearing a blockage and understanding its cause are different jobs.', href: '/services#recurring-blockages', action: 'Recurring blockage investigation' },
  { title: 'Considering a proposed repair?', text: 'Start with the evidence. Request an on-site inspection or use our existing free video review to understand what the footage supports.', href: '/video-review', action: 'Inspection and second opinions' },
]
export default function InspectionPaths() {
  return <section className="section-padding bg-white" aria-labelledby="start-here"><div className="max-w-6xl mx-auto px-4">
    <p className="eyebrow">Start with what you need to know</p><h2 id="start-here" className="text-3xl font-bold mb-8">A closer look before your next decision.</h2>
    <div className="grid md:grid-cols-3 gap-6">{paths.map(p => <article key={p.href} className="p-6 border border-primary-100 rounded-xl"><h3 className="text-xl font-bold mb-3">{p.title}</h3><p className="text-gray-600 mb-5">{p.text}</p><Link className="text-primary-700 font-semibold underline" href={p.href}>{p.action}</Link></article>)}</div>
  </div></section>
}
