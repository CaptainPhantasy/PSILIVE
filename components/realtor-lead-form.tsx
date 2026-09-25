'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Send, CheckCircle, Loader2 } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'
import toast, { Toaster } from 'react-hot-toast'
import { useLeadCapture } from '@/hooks/use-lead-capture'
import { T } from '@/components/diversity/diversity-provider'

// Same session key as hooks/use-lead-capture.ts so the direct submit upserts
// the same LeadCapture row that incremental field capture created.
const LEAD_SESSION_KEY = 'psi_lead_session'

function getOrCreateSessionToken(): string {
  if (typeof window === 'undefined') return ''
  let token = sessionStorage.getItem(LEAD_SESSION_KEY)
  if (!token) {
    token = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    sessionStorage.setItem(LEAD_SESSION_KEY, token)
  }
  return token
}

export default function RealtorLeadForm() {
  const { captureField, markConverted } = useLeadCapture('realtors')
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleLeadBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (!value.trim()) return
    const fieldMap: Record<string, string> = { email: 'email', name: 'name', phone: 'phone' }
    const key = fieldMap[name]
    if (key) {
      captureField({ [key]: value.trim() })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email) {
      toast.error('Please fill in your name and email')
      return
    }

    setIsSubmitting(true)

    try {
      // Direct POST — success state is driven by the { success: true } response,
      // never by the fire-and-forget captureField hook.
      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: getOrCreateSessionToken(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          source: 'realtors',
          pageUrl: window.location.pathname,
        }),
      })

      const data = await response.json().catch(() => null)

      if (response.ok && data?.success === true) {
        markConverted()
        setIsSubmitted(true)
        toast.success('Partner request received!')
      } else {
        toast.error('Failed to submit. Please try again.')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-gray-50 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4"><T>You&apos;re on the partner list</T></h3>
        <p className="text-gray-600 mb-6">
          <T>Thanks for reaching out. We&apos;ll contact you within one business day to set up your partner access and walk through how scheduling works for your transactions.</T>
        </p>
        <p className="text-sm text-gray-500">
          <T>Need something now? Call us at</T>{' '}
          <a href={`tel:${COMPANY_INFO.phoneRaw}`} className="text-primary-600 hover:underline">
            {COMPANY_INFO.phone}
          </a>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-8">
      <Toaster position="top-center" />
      <h3 className="text-xl font-bold text-gray-900 mb-6"><T>Join the Partner Program</T></h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="partner-name" className="block text-sm font-medium text-gray-700 mb-1">
            <T>Name</T> <span className="text-red-500">*</span>
          </label>
          <input
            id="partner-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={handleLeadBlur}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="partner-email" className="block text-sm font-medium text-gray-700 mb-1">
            <T>Email</T> <span className="text-red-500">*</span>
          </label>
          <input
            id="partner-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            onBlur={handleLeadBlur}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="partner-phone" className="block text-sm font-medium text-gray-700 mb-1">
            <T>Phone</T>
          </label>
          <input
            id="partner-phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            onBlur={handleLeadBlur}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            autoComplete="tel"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <T>Submitting...</T>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <T>Request Partner Access</T>
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          <T>We use your details only to contact you about the Partner Program — no spam, no list-selling.</T>{' '}
          <Link href="/privacy" className="text-primary-600 hover:underline">
            <T>Privacy Policy</T>
          </Link>
        </p>
      </form>
    </div>
  )
}
