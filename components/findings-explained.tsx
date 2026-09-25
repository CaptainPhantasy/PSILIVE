const items = [
  ['Observed condition', 'What the camera or locator actually showed, where accessible, with the recording and any useful footage-counter references.'],
  ['Possible cause', 'An explanation that still needs checking. A camera view alone may not establish why a blockage or defect developed.'],
  ['Proposed remedy', 'An option to discuss, with its purpose, limits and separate price. If several options fit, we explain the tradeoffs.'],
  ['Approved work', 'Only the scope and price you have agreed to. A finding, report or request for a quote is not approval to perform more work.'],
]
export default function FindingsExplained() {
  return <section className="section-padding bg-gray-50"><div className="max-w-5xl mx-auto px-4"><h2 className="text-3xl font-bold mb-5">What the findings mean.</h2>
    <p className="text-lg text-gray-600 mb-8">If the accessible findings do not support additional work, we say so. An uninspected section remains a limitation, even when the section we can see looks clear.</p>
    <dl className="grid md:grid-cols-2 gap-6">{items.map(([title,text]) => <div key={title} className="bg-white rounded-xl p-6"><dt className="text-xl font-semibold mb-2">{title}</dt><dd className="text-gray-600">{text}</dd></div>)}</dl>
  </div></section>
}
