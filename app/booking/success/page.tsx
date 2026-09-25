'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Calendar, Phone, ArrowRight, Clock, MapPin, AlertCircle, Loader2 } from 'lucide-react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { COMPANY_INFO } from '@/lib/constants'

interface BookingConfirmation {
  success: boolean;
  calendarBooked?: boolean;
  needsReschedule?: boolean;
  message?: string;
  appointment?: {
    date: string;
    display: string;
  };
  error?: string;
}

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [isLoading, setIsLoading] = useState(true)
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const confirmBooking = async () => {
      if (!sessionId) {
        setError('No payment reference was provided. Return to booking to start or call us if you already paid.')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/booking/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        const data = await response.json()
        setConfirmation(data)

        if (!response.ok || !data.success) {
          setError(data.error || 'Failed to confirm booking')
        }
      } catch (err) {
        console.error('Error confirming booking:', err)
        setError('Failed to confirm booking. Please contact us if you have concerns.')
      } finally {
        setIsLoading(false)
      }
    }

    confirmBooking()
  }, [sessionId])

  // Format the appointment date for display
  const formatAppointmentDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Confirming your booking...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="section-padding bg-gradient-to-b from-secondary-50 to-white">
          <div className="container-custom max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                {confirmation?.success ? <CheckCircle className="w-10 h-10 text-secondary-600" /> : <AlertCircle className="w-10 h-10 text-amber-600" />}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {confirmation?.success ? 'Payment Successful!' : 'Payment not confirmed'}
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                {confirmation?.success ? 'Thank you for booking with Precision Sewer Inspections.' : 'We could not verify a completed payment for this visit.'}
              </p>

              {/* Appointment Confirmation */}
              {confirmation?.calendarBooked && confirmation.appointment && (
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 mb-6 text-left">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-primary-900 text-lg">Appointment Confirmed!</h2>
                      <p className="text-primary-700 text-sm">Added to our calendar</p>
                    </div>
                  </div>
                  <div className="space-y-2 pl-15">
                    <div className="flex items-center gap-2 text-primary-800">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{formatAppointmentDate(confirmation.appointment.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary-800">
                      <MapPin className="w-4 h-4" />
                      <span>{confirmation.appointment.display}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Needs Reschedule Warning */}
              {confirmation?.needsReschedule && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h2 className="font-bold text-amber-900 mb-1">Scheduling Note</h2>
                      <p className="text-amber-800 text-sm">
                        Your payment was successful, but the selected time slot is no longer available. 
                        We will contact you shortly to find a new time that works for you.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* No Appointment Selected */}
              {confirmation?.success && !confirmation?.calendarBooked && !confirmation?.needsReschedule && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <Phone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h2 className="font-bold text-blue-900 mb-1">We&apos;ll Be In Touch</h2>
                      <p className="text-blue-800 text-sm">
                        Your payment is confirmed! We will contact you within 24 hours to schedule your inspection.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h2 className="font-bold text-red-900 mb-1">Confirmation Issue</h2>
                      <p className="text-red-800 text-sm">
                        {error} If you completed payment, call us before trying to pay again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {confirmation?.success && <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                <h2 className="font-semibold text-gray-900 mb-4">What happens next?</h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-800">1</span>
                    <span>You will receive a confirmation email with your booking details</span>
                  </li>
                  {confirmation?.calendarBooked ? (
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-800">2</span>
                      <span>We&apos;ll send a reminder the day before your scheduled inspection</span>
                    </li>
                  ) : (
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-800">2</span>
                      <span>We will call you within 24 hours to confirm your inspection time</span>
                    </li>
                  )}
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-800">3</span>
                    <span>After your inspection, you&apos;ll receive your HD video and detailed report within one business day</span>
                  </li>
                </ul>
              </div>}

              {sessionId && (
                <p className="text-sm text-gray-500 mb-6">
                  Confirmation ID: {sessionId.slice(0, 20)}...
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  Return Home
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={`tel:${COMPANY_INFO.phoneRaw}`}
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call Us: {COMPANY_INFO.phone}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}
