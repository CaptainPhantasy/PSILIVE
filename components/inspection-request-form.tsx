'use client'

import { useRef, useState } from 'react'
import { submitInspectionRequest } from '@/lib/request-submission'
import { IDC_BOOK_URL } from '@/lib/inspection-and-service'

export default function InspectionRequestForm() {
  const [interest, setInterest] = useState('inspection')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const pending = useRef(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const form = new FormData(event.currentTarget)
    if (form.get('website')) { setStatus('error'); return }
    pending.current = true
    setStatus('sending')
    try {
      await submitInspectionRequest(Object.fromEntries(Array.from(form.entries()).map(([key, value]) => [key, String(value)])))
      setStatus('sent')
    } catch { setStatus('error') }
    finally { pending.current = false }
  }
  if (status === 'sent') return <div role="status" className="p-6 bg-primary-50 rounded-xl">
    <h3 className="text-2xl font-bold mb-3">Your request was sent.</h3>
    <p>We will contact you to confirm the address, access, scope, price and appointment. Your appointment is not confirmed yet, and no additional work has been approved.</p>
    <p className="mt-4">Need help sooner? Call <a className="underline" href="tel:3176203858">(317) 620-3858</a>.</p>
  </div>
  const field = 'block w-full mt-2 rounded-lg border border-gray-300 px-3 py-3 bg-white text-gray-900'
  return <form onSubmit={submit} className="space-y-5" aria-busy={status === 'sending'}>
    <label className="block font-medium">What can we help with?
      <select className={field} name="interest" value={interest} onChange={e => setInterest(e.target.value)}>
        <option value="inspection">Inspection or on-site second opinion</option>
        <option value="locating">Locating or a route sketch</option>
        <option value="commercial">Commercial or multiple-line inspection</option>
        <option value="pump">Accessible household or pool pump inspection</option>
        <option value="not-sure">I’m not sure what I need</option>
        <option value="drain-service">Drain cleaning or repair through IDC</option>
      </select>
    </label>
    {interest === 'drain-service' ? <div className="rounded-xl bg-primary-50 p-5">
      <h3 className="text-xl font-bold mb-2">Indiana Drain Company handles this work.</h3>
      <p>Our affiliated service company handles cleaning, maintenance and suitable repairs. Continue to IDC to send one service request, or call our shared number. Mention any existing PSI report or job reference so the team can review it first.</p>
      <a className="btn-primary mt-4" href={IDC_BOOK_URL}>Continue to Indiana Drain Company</a>
    </div> : <>
      <p className="text-gray-600">One request is enough. Tell us what you need to understand; we will help work out the appropriate scope. This form does not collect payment or dispatch a technician.</p>
      <div className="grid sm:grid-cols-2 gap-5">
        <label className="block font-medium">Name<input className={field} name="name" autoComplete="name" required maxLength={120} /></label>
        <label className="block font-medium">Phone<input className={field} name="phone" type="tel" autoComplete="tel" required maxLength={40} /></label>
      </div>
      <label className="block font-medium">Email<input className={field} name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label className="block font-medium">Service address, city and ZIP<input className={field} name="address" autoComplete="street-address" required maxLength={300} /></label>
      <label className="block font-medium">What would you like to understand?<textarea className={field} name="concern" required minLength={10} maxLength={3000} rows={4} /></label>
      <label className="block font-medium">Available access<input className={field} name="access" required placeholder="Cleanout, accessible opening, or not sure" maxLength={400} /></label>
      <label className="block font-medium">Previous report or job reference (optional)<input className={field} name="previousJob" maxLength={200} /></label>
      <p className="text-sm text-gray-600">Tell us if you have a recording or report. We will arrange how to share it; do not put private files, access codes or payment details here. An existing inspection may support a quote. New footage is needed only when changed conditions or missing information require it.</p>
      <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex items-start gap-3"><input type="checkbox" name="contactConsent" required className="mt-1" /><span>PSI may contact me about this request. This does not approve additional work or marketing messages.</span></label>
      {status === 'error' && <div role="alert" className="p-4 border border-red-300 rounded-lg text-red-800">We could not confirm that your request was sent. Your entries are still here. Please call <a href="tel:3176203858" className="underline">(317) 620-3858</a> or email <a href="mailto:Douglas@PrecisionSewerInspections.com" className="underline break-all">Douglas@PrecisionSewerInspections.com</a>.</div>}
      <button type="submit" disabled={status === 'sending'} className="btn-primary disabled:opacity-50">{status === 'sending' ? 'Sending request…' : 'Request an inspection'}</button>
      <p className="text-sm text-gray-600">By sending, you share these details with PSI through our form delivery provider. <a className="underline" href="/privacy">Privacy information</a>.</p>
    </>}
  </form>
}
