'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Send, Loader2, CheckCircle, AlertCircle, CreditCard, Tag, Calendar, Clock, ChevronRight, ArrowLeft, User, MapPin, FileText, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPromoDiscount } from '@/components/promo-banner'
import { ADD_ON_OPTIONS, AddOnId, calculateCheckoutPricing, formatCents, SERVICE_OPTIONS, ServiceType } from '@/lib/checkout-pricing'
import { COMPANY_INFO } from '@/lib/constants'
import { useLeadCapture } from '@/hooks/use-lead-capture'
import { T, useDiversity } from '@/components/diversity/diversity-provider'

const occupancyOptions = [
  { value: '', label: 'Select occupancy status...' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'vacant', label: 'Vacant' },
  { value: 'tenant-occupied', label: 'Tenant Occupied' },
]

const howHeardOptions = [
  { value: '', label: "How'd you find us?" },
  { value: 'google', label: 'Google Search' },
  { value: 'google-maps', label: 'Google Maps' },
  { value: 'referral', label: 'Friend or Family Referral' },
  { value: 'real-estate-agent', label: 'Real Estate Agent' },
  { value: 'home-inspector', label: 'Home Inspector' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'nextdoor', label: 'Nextdoor' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'repeat-customer', label: 'Repeat Customer' },
  { value: 'other', label: 'Other' },
]

const serviceTypes = SERVICE_OPTIONS

function isAllowedServiceType(value: unknown): value is ServiceType {
  return value === 'sewer-inspection' || value === 'sewer-inspection-toilet' || value === 'sewer-inspection-roof'
}

function normalizeInput(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

interface TimeSlot {
  start: string;
  end: string;
  display: string;
  available: boolean;
}

interface DayAvailability {
  date: string;
  dayName: string;
  displayDate: string;
  slots: TimeSlot[];
  hasAvailableSlots: boolean;
}

type Step = 'job-details' | 'datetime' | 'client-details' | 'review'

function getOrdinalSuffix(day: number) {
  if (day > 3 && day < 21) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

export default function ContactForm() {
  const [currentStep, setCurrentStep] = useState<Step>('job-details')
  const [formData, setFormData] = useState({
    serviceType: 'sewer-inspection',
    occupancy: '',
    propertyAccess: '',
    cleanoutLocation: '',
    referrerName: '',
    buyersAgent: '',
    listingAgent: '',
    howHeardAboutUs: '',
    promoCode: '',
    selectedDate: '',
    selectedTimeSlot: null as TimeSlot | null,
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    streetAddress: '',
    city: 'INDIANAPOLIS',
    state: 'Indiana',
    zipCode: '',
    directions: '',
    agreeToTerms: false,
    subscribeNewsletter: false,
    accessVerified: false,
    addOns: [] as AddOnId[],
  })

  const { captureField, markConverted } = useLeadCapture('booking-form')
  const { t } = useDiversity()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const checkoutPending = useRef(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState<{ code: string; amount: number } | null>(null)
  const [showTerms, setShowTerms] = useState(false)

  // Calendar state
  const [availability, setAvailability] = useState<DayAvailability[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [calendarError, setCalendarError] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    let savedDraft: Partial<typeof formData> = {}
    try {
      const storedDraft = sessionStorage.getItem('psiBookingDraft')
      if (storedDraft) {
        savedDraft = JSON.parse(storedDraft)
      }
    } catch {
      sessionStorage.removeItem('psiBookingDraft')
    }

    const discount = getPromoDiscount()
    if (discount) {
      setPromoDiscount(discount)
    }

    setFormData(prev => ({
      ...prev,
      ...savedDraft,
      agreeToTerms: false,
      promoCode: discount?.code || savedDraft.promoCode || prev.promoCode,
    }))
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem('psiBookingDraft', JSON.stringify({ ...formData, agreeToTerms: false }))
    } catch {
      // Draft persistence is best-effort; checkout must continue even if storage is unavailable.
    }
  }, [formData])

  useEffect(() => {
    if (currentStep === 'datetime' && availability.length === 0) {
      fetchAvailability()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  const fetchAvailability = async () => {
    setIsLoadingSlots(true)
    setCalendarError('')
    try {
      const response = await fetch('/api/calendar/availability', { cache: 'no-store' })
      const data = await response.json()
      if (response.ok && data.success && Array.isArray(data.availability)) {
        setAvailability(data.availability)
        const firstAvailable = data.availability.find((d: DayAvailability) => d.hasAvailableSlots)
        if (firstAvailable) {
          setCurrentMonth(new Date(firstAvailable.date + 'T12:00:00'))
          setFormData(prev => ({ ...prev, selectedDate: firstAvailable.date, selectedTimeSlot: null }))
        } else {
          setFormData(prev => ({ ...prev, selectedDate: '', selectedTimeSlot: null }))
        }
      } else {
        setCalendarError(data.error || 'Failed to load availability')
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      setCalendarError('Failed to load available times. Please try again.')
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleServiceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      serviceType: e.target.value as ServiceType,
      accessVerified: false,
    }))
  }

  const toggleAddOn = (addOnId: AddOnId, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      addOns: checked
        ? Array.from(new Set([...prev.addOns, addOnId]))
        : prev.addOns.filter(id => id !== addOnId),
    }))
  }

  // Lead capture on blur for key fields
  const handleLeadBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (!value.trim()) return
    const fieldMap: Record<string, string> = {
      email: 'email',
      firstName: 'name',
      phone: 'phone',
      streetAddress: 'address',
      city: 'city',
      state: 'state',
      zipCode: 'zip',
    }
    const captureKey = fieldMap[name]
    if (captureKey) {
      const payload: Record<string, string> = { [captureKey]: value.trim() }
      // Also send name as first + last if we have both
      if (captureKey === 'name' && formData.lastName) {
        payload.name = `${value.trim()} ${formData.lastName}`
      }
      // Always include email/phone if available for upsert
      if (formData.email && captureKey !== 'email') payload.email = formData.email
      if (formData.phone && captureKey !== 'phone') payload.phone = formData.phone
      captureField(payload)
    }
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) return
    setFormData(prev => ({ ...prev, selectedTimeSlot: slot }))
  }

  const handleDateSelect = (date: string) => {
    setFormData(prev => ({ ...prev, selectedDate: date, selectedTimeSlot: null }))
  }

  const activePromoCode = promoDiscount?.code || formData.promoCode
  const pricing = calculateCheckoutPricing(formData.serviceType, formData.addOns, activePromoCode)
  const getAccessVerificationCopy = () => {
    if (formData.serviceType === 'sewer-inspection-toilet') {
      return 'I confirm toilet pull/reset access is needed and approve the +$65 charge, including a new wax ring and supply line.'
    }
    if (formData.serviceType === 'sewer-inspection-roof') {
      return 'I confirm roof vent access is needed and approve the +$50 roof vent access charge.'
    }
    return 'I verified a usable cleanout is accessible. If it is not accessible on-site, I understand alternate access or trip fees may apply.'
  }

  const validateStep = (step: Step): boolean => {
    if (step === 'job-details') {
      if (!normalizeInput(formData.occupancy)) {
        toast.error('Please select occupancy status')
        return false
      }
      if (!normalizeInput(formData.propertyAccess)) {
        toast.error('Please provide property access instructions')
        return false
      }
      if (!normalizeInput(formData.cleanoutLocation)) {
        toast.error('Please provide the cleanout location (or unknown if not found yet)')
        return false
      }
      if (!formData.accessVerified) {
        toast.error('Please verify the selected access method and any related charges')
        return false
      }
      return true
    }
    if (step === 'datetime') {
      if (!formData.selectedDate || !formData.selectedTimeSlot || !availability.some(day => day.date === formData.selectedDate && day.slots.some(slot => slot.start === formData.selectedTimeSlot?.start && slot.available))) {
        toast.error('Please select an appointment date and time')
        return false
      }
      return true
    }
    if (step === 'client-details') {
      const firstName = normalizeInput(formData.firstName)
      const lastName = normalizeInput(formData.lastName)
      const phone = normalizeInput(formData.phone)
      const email = normalizeInput(formData.email)
      const streetAddress = normalizeInput(formData.streetAddress)
      const city = normalizeInput(formData.city)
      if (!firstName || !lastName || !phone || !email || !streetAddress || !city) {
        toast.error('Please fill in all required fields')
        return false
      }
      if (!EMAIL_PATTERN.test(email)) {
        toast.error('Please enter a valid email address')
        return false
      }
      if (!isValidPhone(phone)) {
        toast.error('Please enter a valid phone number')
        return false
      }
      return true
    }
    return true
  }

  const goToNextStep = () => {
    if (currentStep === 'job-details' && validateStep('job-details')) setCurrentStep('datetime')
    else if (currentStep === 'datetime' && validateStep('datetime')) setCurrentStep('client-details')
    else if (currentStep === 'client-details' && validateStep('client-details')) setCurrentStep('review')
  }

  const goToPreviousStep = () => {
    if (currentStep === 'datetime') setCurrentStep('job-details')
    else if (currentStep === 'client-details') setCurrentStep('datetime')
    else if (currentStep === 'review') setCurrentStep('client-details')
  }

  const goToStep = (step: Step) => setCurrentStep(step)

  const handleCheckout = async () => {
    if (checkoutPending.current) return
    if (!isAllowedServiceType(formData.serviceType)) {
      toast.error('Please select a valid service type')
      return
    }

    if (!validateStep('job-details') || !validateStep('datetime') || !validateStep('client-details')) {
      return
    }

    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms of service')
      return
    }

    if (!formData.accessVerified) {
      toast.error('Please verify the selected access method before continuing')
      return
    }

    const customerEmail = normalizeInput(formData.email)
    const firstName = normalizeInput(formData.firstName)
    const lastName = normalizeInput(formData.lastName)
    const fullAddress = normalizeInput(`${normalizeInput(formData.streetAddress)}${formData.city ? `, ${normalizeInput(formData.city)}` : ''}${formData.state ? `, ${normalizeInput(formData.state)}` : ''}${formData.zipCode ? ` ${normalizeInput(formData.zipCode)}` : ''}`)

    if (!firstName || !lastName || !customerEmail || !formData.selectedTimeSlot?.start || !formData.selectedDate || !formData.selectedTimeSlot?.display || !formData.selectedTimeSlot?.end) {
      toast.error('Please complete all required fields before checkout')
      return
    }

    checkoutPending.current = true
    setIsCheckingOut(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail,
          customerName: `${firstName} ${lastName}`,
          customerPhone: normalizeInput(formData.phone),
          propertyAddress: fullAddress,
          accessVerified: formData.accessVerified,
          accessMethod: formData.serviceType.includes('toilet') ? 'toilet-pull' : formData.serviceType.includes('roof') ? 'roof-vent' : 'cleanout',
          sewerAccessMethod: normalizeInput(formData.cleanoutLocation),
          addOns: formData.addOns,
          message: `Occupancy: ${normalizeInput(formData.occupancy)}\nAccess: ${normalizeInput(formData.propertyAccess)}\nCleanout: ${normalizeInput(formData.cleanoutLocation)}\nReferrer: ${normalizeInput(formData.referrerName)}\nBuyer's Agent: ${normalizeInput(formData.buyersAgent)}\nListing Agent: ${normalizeInput(formData.listingAgent)}\nHow heard: ${normalizeInput(formData.howHeardAboutUs)}\nDirections: ${normalizeInput(formData.directions)}`,
          promoCode: activePromoCode,
          appointmentStart: formData.selectedTimeSlot?.start,
          appointmentEnd: formData.selectedTimeSlot?.end,
          appointmentDisplay: formData.selectedTimeSlot?.display,
          appointmentDate: formData.selectedDate,
          serviceType: formData.serviceType,
          // Structured form fields for database storage
          occupancy: normalizeInput(formData.occupancy),
          propertyAccess: normalizeInput(formData.propertyAccess),
          cleanoutLocation: normalizeInput(formData.cleanoutLocation),
          referrerName: normalizeInput(formData.referrerName),
          buyersAgent: normalizeInput(formData.buyersAgent),
          listingAgent: normalizeInput(formData.listingAgent),
          howHeardAboutUs: normalizeInput(formData.howHeardAboutUs),
          directions: normalizeInput(formData.directions),
          propertyCity: normalizeInput(formData.city),
          propertyState: normalizeInput(formData.state),
          propertyZip: normalizeInput(formData.zipCode),
        }),
      })
      const result = await response.json()
      if (response.ok && typeof result?.url === 'string' && new URL(result.url).origin === 'https://checkout.stripe.com') {
        markConverted()
        window.location.href = result.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout. Please try again or call us directly.')
    } finally {
      checkoutPending.current = false
      setIsCheckingOut(false)
    }
  }

  const formatAppointmentDate = () => {
    if (!formData.selectedDate) return ''
    const date = new Date(formData.selectedDate + 'T12:00:00')
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const formatAppointmentDateShort = () => {
    if (!formData.selectedDate) return ''
    const date = new Date(formData.selectedDate + 'T12:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  // Calendar generation
  const availableDates = useMemo(() => availability.filter(d => d.hasAvailableSlots).map(d => d.date), [availability])
  const selectedDayData = availability.find(d => d.date === formData.selectedDate)

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const days: (Date | null)[] = []
    for (let i = 0; i < startPadding; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }, [currentMonth])

  const todayDate = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // Step indicator
  const steps = [
    { key: 'job-details' as const, label: 'Job Details', number: 1 },
    { key: 'datetime' as const, label: 'Date & Time', number: 2 },
    { key: 'client-details' as const, label: 'Your Details', number: 3 },
    { key: 'review' as const, label: 'Review & Confirm', number: 4 },
  ]
  const currentIndex = steps.findIndex(s => s.key === currentStep)

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-secondary-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2"><T>You&apos;re Booked!</T></h3>
        <p className="text-gray-600 mb-6"><T>Your inspection is scheduled. Check your email for your confirmation and appointment details.</T></p>
        <button onClick={() => setIsSuccess(false)} className="btn-secondary"><T>Book Another Inspection</T></button>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const isActive = currentStep === step.key
            const isPast = index < currentIndex
            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive || isPast ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {step.number}
                  </div>
                  <span className={`text-sm mt-1 max-w-[76px] text-center ${isActive ? 'text-primary-600 font-semibold' : isPast ? 'text-primary-600' : 'text-gray-500'}`}>
                    <T>{step.label}</T>
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block sm:w-6 h-0.5 sm:mx-2 ${isPast ? 'bg-primary-600' : 'bg-gray-300'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ==================== STEP 1: Job Details ==================== */}
      {currentStep === 'job-details' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900"><T>Job Details</T></h2>
            <p className="text-gray-600 text-sm"><T>Tell us about the property and how we can access it.</T></p>
          </div>
          <div className="bg-primary-900 text-white rounded-lg p-4 space-y-3">
            <label htmlFor="serviceType" className="block text-sm font-medium text-primary-200"><T>Select Service Type</T></label>
            <select
              id="serviceType"
              name="serviceType"
              value={formData.serviceType}
              onChange={handleServiceTypeChange}
              className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 font-semibold focus:ring-2 focus:ring-primary-400"
            >
              {serviceTypes.map(opt => (
                <option key={opt.value} value={opt.value}><T>{opt.label}</T> - {formatCents(opt.amountCents)}</option>
              ))}
            </select>
            <div className="text-sm text-primary-200 space-y-1">
              {serviceTypes.map(option => (
                <p key={option.value}><span className="font-semibold"><T>{option.label}</T> ({formatCents(option.amountCents)}):</span> <T>{option.description}</T></p>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="occupancy" className="form-label"><span className="text-primary-600">*</span> <T>Property Occupancy Status</T></label>
            <select id="occupancy" name="occupancy" value={formData.occupancy} onChange={handleChange} className="form-input" required>
              {occupancyOptions.map(opt => (<option key={opt.value} value={opt.value}><T>{opt.label}</T></option>))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="propertyAccess" className="form-label"><span className="text-primary-600">*</span> <T>Property Access Instructions</T></label>
              <textarea id="propertyAccess" name="propertyAccess" value={formData.propertyAccess} onChange={handleChange} placeholder={t('Lockbox code, gate code, showing instructions, alarm info, etc.')} rows={3} className="form-input resize-none" required />
            </div>
            <div>
              <label htmlFor="cleanoutLocation" className="form-label"><span className="text-primary-600">*</span> <T>Cleanout Location (if known)</T></label>
              <textarea id="cleanoutLocation" name="cleanoutLocation" value={formData.cleanoutLocation} onChange={handleChange} placeholder={t('Basement, side yard, front yard, unknown, etc.')} rows={3} className="form-input resize-none" required />
            </div>
          </div>

          <div>
            <label htmlFor="referrerName" className="form-label"><T>Who referred you? (optional)</T></label>
            <input id="referrerName" type="text" name="referrerName" value={formData.referrerName} onChange={handleChange} className="form-input" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="buyersAgent" className="form-label"><T>Buyer&apos;s Agent Contact Info</T></label>
              <textarea id="buyersAgent" name="buyersAgent" value={formData.buyersAgent} onChange={handleChange} placeholder={t('Name, phone, or email')} rows={2} className="form-input resize-none" />
            </div>
            <div>
              <label htmlFor="listingAgent" className="form-label"><T>Listing Agent Contact Info</T></label>
              <textarea id="listingAgent" name="listingAgent" value={formData.listingAgent} onChange={handleChange} placeholder={t('Name, phone, or email')} rows={2} className="form-input resize-none" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="howHeardAboutUs" className="form-label"><T>How did you hear about us?</T></label>
              <select id="howHeardAboutUs" name="howHeardAboutUs" value={formData.howHeardAboutUs} onChange={handleChange} className="form-input">
                {howHeardOptions.map(opt => (<option key={opt.value} value={opt.value}><T>{opt.label}</T></option>))}
              </select>
            </div>
            <div>
              <label htmlFor="promoCode" className="form-label"><T>Promo Code</T></label>
              <input id="promoCode" type="text" name="promoCode" value={formData.promoCode} onChange={handleChange} placeholder={t('Enter promo code')} className="form-input" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-2">
            <p>&#8226; <T>Need a date or time not shown? Call us at </T><a href={`tel:${COMPANY_INFO.phoneRaw}`} className="text-primary-600 font-semibold hover:underline">{COMPANY_INFO.phone}</a><T> — we&apos;ll do our best to work with your schedule.</T></p>
            <p>&#8226; <T>Every inspection includes a detailed written report and HD video recording, delivered to your inbox within one business day.</T></p>
            <p>&#8226; <T>Payment is collected at checkout before service is confirmed.</T></p>
            <p>&#8226; <T>Before continuing, verify the selected access method. Standard pricing requires an accessible cleanout; toilet pull/reset includes a new wax ring and supply line; roof vent access is a separate priced access method.</T></p>
          </div>

          <label className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50 rounded-lg cursor-pointer">
            <input type="checkbox" name="accessVerified" checked={formData.accessVerified} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5" required />
            <span className="text-sm text-amber-900"><span className="font-semibold"><T>Access verification required:</T></span> <T>{getAccessVerificationCopy()}</T></span>
          </label>

          <button type="button" onClick={goToNextStep} className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg">
            <T>CONTINUE</T> <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ==================== STEP 2: Date & Time ==================== */}
      {currentStep === 'datetime' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button type="button" aria-label="Back to job details" onClick={goToPreviousStep} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900"><T>Date & Time</T></h2>
              <p className="text-gray-600 text-sm"><T>Choose an available date and time. All appointments are shown in Indianapolis time.</T></p>
            </div>
          </div>

          {isLoadingSlots ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-3" />
              <p className="text-gray-600"><T>Loading available times...</T></p>
            </div>
          ) : calendarError ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4"><T>{calendarError}</T></p>
              <button onClick={fetchAvailability} className="btn-secondary"><T>Try Again</T></button>
            </div>
          ) : availableDates.length === 0 ? (
            <div role="status" className="rounded-lg bg-gray-50 p-5 text-gray-700">
              <p>No appointments are available in the next seven days. Check again or call <a className="underline" href={`tel:${COMPANY_INFO.phoneRaw}`}>{COMPANY_INFO.phone}</a> for help scheduling.</p>
              <button type="button" onClick={fetchAvailability} className="btn-secondary mt-4">Check availability again</button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Calendar */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <button type="button" aria-label="Previous month" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-bold">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                  <button type="button" aria-label="Next month" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-sm font-semibold text-gray-500 py-2">{day}</div>
                  ))}
                  {calendarDays.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} className="p-2" />
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                    const available = availableDates.includes(dateStr)
                    const selected = formData.selectedDate === dateStr
                    const isPast = date < todayDate
                    const isTodayDate = todayDate.toISOString().split('T')[0] === dateStr
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => { if (available) handleDateSelect(dateStr) }}
                        disabled={!available || isPast}
                        className={`p-2 rounded-full text-sm transition-all relative ${
                          selected ? 'bg-primary-600 text-white font-bold'
                          : available ? 'bg-sky-100 text-sky-700 hover:bg-sky-200 font-semibold'
                          : isPast ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {date.getDate()}
                        {isTodayDate && <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Available Dates List */}
              <div className="lg:w-64">
                <div className="space-y-2">
                  {availability.filter(d => d.hasAvailableSlots).slice(0, 5).map((day) => {
                    const date = new Date(day.date + 'T12:00:00')
                    const isSelected = formData.selectedDate === day.date
                    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
                    const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => handleDateSelect(day.date)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <span className="font-semibold">{dayOfWeek} {monthDay}</span>
                        <sup className="ml-0.5">{getOrdinalSuffix(date.getDate())}</sup>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Time Slot Selection */}
          {formData.selectedDate && selectedDayData && (
            <div className="border-t pt-6">
              <label className="form-label flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4" /> <T>Select a Time for</T> {formatAppointmentDateShort()}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedDayData.slots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSlotSelect(slot)}
                    disabled={!slot.available}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      formData.selectedTimeSlot?.start === slot.start ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                      : slot.available ? 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      : 'border-gray-100 bg-gray-100 opacity-50 cursor-not-allowed line-through'
                    }`}
                  >
                    <div className={`font-semibold ${
                      formData.selectedTimeSlot?.start === slot.start ? 'text-primary-700' : slot.available ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {slot.display}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="button" onClick={goToNextStep} disabled={!formData.selectedDate || !formData.selectedTimeSlot} className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
            <T>CONTINUE</T> <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ==================== STEP 3: Client Details ==================== */}
      {currentStep === 'client-details' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={goToPreviousStep} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900"><T>Client Details</T></h2>
              <p className="text-gray-600 text-sm"><T>Enter your contact info and the address where the inspection will take place.</T></p>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="flex items-center gap-2 text-primary-600 font-semibold mb-4">
              <User className="w-5 h-5" /> <T>Contact Details</T>
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="form-label"><span className="text-primary-600">*</span> <T>First Name</T></label>
                <input id="firstName" type="text" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleLeadBlur} className="form-input" required autoComplete="given-name" />
              </div>
              <div>
                <label htmlFor="lastName" className="form-label"><span className="text-primary-600">*</span> <T>Last Name</T></label>
                <input id="lastName" type="text" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleLeadBlur} className="form-input" required autoComplete="family-name" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="phone" className="form-label"><span className="text-primary-600">*</span> <T>Phone</T></label>
                <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleLeadBlur} placeholder="(317) 000-0000" className="form-input" required autoComplete="tel" />
              </div>
              <div>
                <label htmlFor="email" className="form-label"><span className="text-primary-600">*</span> <T>Email</T></label>
                <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleLeadBlur} className="form-input" required autoComplete="email" />
              </div>
            </div>
          </div>

          {/* Service Address */}
          <div>
            <h3 className="flex items-center gap-2 text-primary-600 font-semibold mb-4">
              <MapPin className="w-5 h-5" /> <T>Service Address</T>
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="streetAddress" className="form-label"><span className="text-primary-600">*</span> <T>Street Address</T></label>
                <input id="streetAddress" type="text" name="streetAddress" value={formData.streetAddress} onChange={handleChange} onBlur={handleLeadBlur} className="form-input" required autoComplete="street-address" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label htmlFor="city" className="form-label"><span className="text-primary-600">*</span> <T>City</T></label>
                  <input id="city" type="text" name="city" value={formData.city} onChange={handleChange} onBlur={handleLeadBlur} className="form-input" required autoComplete="address-level2" />
                </div>
                <div>
                  <label htmlFor="state" className="form-label"><span className="text-primary-600">*</span> <T>State</T></label>
                  <select id="state" name="state" value={formData.state} onChange={handleChange} className="form-input">
                    <option value="Indiana">Indiana</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label htmlFor="zipCode" className="form-label"><T>Zip Code</T></label>
                    <input id="zipCode" type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="46227" className="form-input" autoComplete="postal-code" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="directions" className="form-label"><T>Directions</T></label>
                <textarea id="directions" name="directions" value={formData.directions} onChange={handleChange} placeholder={t('Any special directions to find the property...')} rows={3} className="form-input resize-none" />
              </div>
            </div>
          </div>

          <button type="button" onClick={goToNextStep} className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg">
            <T>CONTINUE</T> <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ==================== STEP 4: Review & Confirm ==================== */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={goToPreviousStep} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900"><T>Review & Confirm</T></h2>
              <p className="text-gray-600 text-sm"><T>Review your appointment, property details and total before payment.</T></p>
              <p className="text-sm"><T>Continue to Stripe to pay securely. Your appointment is confirmed after payment and the final availability check.</T></p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Order Details */}
            <div className="bg-white border rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-primary-600 font-semibold"><T>Order Details</T></h3>
                <button type="button" onClick={() => goToStep('job-details')} className="text-primary-600 text-sm flex items-center gap-1 hover:underline"><Edit2 className="w-3 h-3" /> <T>Edit</T></button>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500"><T>Service/access selected:</T></span> <span className="font-medium">{pricing.service.label}</span></div>
                <div><span className="text-gray-500"><T>Access verification:</T></span> <span className="font-medium">{formData.accessVerified ? <T>Confirmed</T> : <T>Not confirmed</T>}</span></div>
                <div><span className="text-gray-500"><T>Occupancy status:</T></span> <span className="font-medium capitalize">{formData.occupancy}</span></div>
                <div><span className="text-gray-500"><T>Access instructions:</T></span> <span className="font-medium">{formData.propertyAccess || 'N/A'}</span></div>
                <div><span className="text-gray-500"><T>Cleanout location:</T></span> <span className="font-medium">{formData.cleanoutLocation || 'N/A'}</span></div>
                {formData.referrerName && <div><span className="text-gray-500"><T>Referred by:</T></span> <span className="font-medium">{formData.referrerName}</span></div>}
                {formData.buyersAgent && <div><span className="text-gray-500"><T>Buyer&apos;s agent:</T></span> <span className="font-medium">{formData.buyersAgent}</span></div>}
                {formData.listingAgent && <div><span className="text-gray-500"><T>Listing agent:</T></span> <span className="font-medium">{formData.listingAgent}</span></div>}
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white border rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-primary-600 font-semibold"><T>Contact Details</T></h3>
                <button type="button" onClick={() => goToStep('client-details')} className="text-primary-600 text-sm flex items-center gap-1 hover:underline"><Edit2 className="w-3 h-3" /> <T>Edit</T></button>
              </div>
              <div className="space-y-1 text-sm">
                <div className="font-semibold">{formData.firstName} {formData.lastName}</div>
                <div><span className="text-gray-500"><T>Phone:</T></span> {formData.phone}</div>
                <div><span className="text-gray-500"><T>Email:</T></span> {formData.email}</div>
                <div className="pt-2"><span className="text-gray-500"><T>Billing Address:</T></span><br />{formData.streetAddress}<br />{formData.city}, {formData.state} {formData.zipCode}</div>
              </div>
            </div>

            {/* Service Date */}
            <div className="bg-white border rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-primary-600 font-semibold"><T>Service Date</T></h3>
                <button type="button" onClick={() => goToStep('datetime')} className="text-primary-600 text-sm flex items-center gap-1 hover:underline"><Edit2 className="w-3 h-3" /> <T>Edit</T></button>
              </div>
              <div className="text-sm">
                <div className="font-semibold">{formatAppointmentDate()}</div>
                <div className="text-gray-600">{formData.selectedTimeSlot?.display}</div>
              </div>
            </div>

            {/* Service Address */}
            <div className="bg-white border rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-primary-600 font-semibold"><T>Service Address</T></h3>
                <button type="button" onClick={() => goToStep('client-details')} className="text-primary-600 text-sm flex items-center gap-1 hover:underline"><Edit2 className="w-3 h-3" /> <T>Edit</T></button>
              </div>
              <div className="text-sm">
                <div className="font-semibold">{formData.streetAddress}</div>
                <div>{formData.city}, {formData.state} {formData.zipCode}</div>
                <div className="pt-2">
                  <span className="text-gray-500"><T>On-site Contact:</T></span> {formData.firstName} {formData.lastName}<br />
                  <span className="text-gray-500"><T>Phone:</T></span> {formData.phone}<br />
                  <span className="text-gray-500"><T>Email:</T></span> {formData.email}
                </div>
              </div>
            </div>
          </div>

          {/* Items / Pricing */}
          <div className="bg-white border rounded-xl p-4">
            <div className="flex justify-between items-center text-sm border-b pb-2 mb-2">
              <span>{pricing.service.label}</span>
              <span>1 X {formatCents(pricing.service.amountCents)}</span>
            </div>
            {/* Add-ons Selection */}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700"><T>Needed items / add-ons:</T></p>
                <button type="button" onClick={() => goToStep('job-details')} className="text-primary-600 text-sm flex items-center gap-1 hover:underline"><Edit2 className="w-3 h-3" /> <T>Edit service</T></button>
              </div>
              <div className="space-y-2">
                {ADD_ON_OPTIONS.map(addOn => (
                  <label key={addOn.id} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.addOns.includes(addOn.id)}
                      onChange={(e) => toggleAddOn(addOn.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5"
                    />
                    <span className="text-sm">
                      <T>{addOn.label}</T> ({formatCents(addOn.amountCents)}) <span className="text-gray-500"><T>{addOn.description}</T></span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2"><T>Verify these before checkout. If needed items are discovered on-site after checkout, they may need to be charged separately.</T></p>
            </div>
            <div className="space-y-1 text-sm mt-3">
              {pricing.addOnItems.map(addOn => (
                <div key={addOn.id} className="flex justify-between text-gray-700">
                  <span><T>{addOn.label}</T></span>
                  <span>{formatCents(addOn.amountCents)}</span>
                </div>
              ))}
              <div className="flex justify-between"><span><T>Subtotal:</T></span><span className="font-semibold">{formatCents(pricing.subtotalCents)}</span></div>
              {pricing.promoApplied && (
                <div className="flex justify-between text-green-600"><span><T>Promo</T> ({activePromoCode.trim().toUpperCase()}):</span><span>-{formatCents(pricing.discountCents)}</span></div>
              )}
              <div className="flex justify-between"><span><T>Tax:</T></span><span>$0.00</span></div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t"><span><T>Total:</T></span><span>{formatCents(pricing.totalCents)}</span></div>
            </div>
            {formData.referrerName && (
              <div className="mt-4 pt-3 border-t text-sm text-gray-600">Thanks for choosing Precision Sewer Inspections!</div>
            )}
          </div>

          {/* Terms and Newsletter */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5" required />
              <span className="text-sm">
                <span className="text-primary-600">*</span> <T>I agree with the terms of service</T>
                <button type="button" onClick={() => setShowTerms(!showTerms)} className="text-primary-600 ml-2 hover:underline">{showTerms ? <T>Hide</T> : <T>Show</T>} <T>Terms of Service</T></button>
              </span>
            </label>
            {showTerms && (
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-2 ml-8">
                <p>&#8226; <strong><T>Trip Fee:</T></strong> <T>A $79 trip fee applies if access is unavailable at the scheduled time.</T></p>
                <p>&#8226; <strong><T>Access Method:</T></strong> <T>If the access method differs from what was selected, additional charges may apply.</T></p>
                <p>&#8226; <strong><T>Cleanout Access:</T></strong> If the selected access is unavailable, we explain any alternative method and additional price for your approval before proceeding.</p>
                <p>&#8226; <strong><T>Payment:</T></strong> <T>Payment is collected at checkout before service is confirmed.</T></p>
                <p>&#8226; <strong><T>Report Delivery:</T></strong> <T>Written report and video will be emailed within one business day of inspection.</T></p>
              </div>
            )}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="subscribeNewsletter" checked={formData.subscribeNewsletter} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm"><T>Please email me occasional promotions and newsletters.</T></span>
            </label>
          </div>

          <p className="text-sm text-gray-600">This payment covers the inspection and selected add-ons. PSI and Indiana Drain Company share ownership; IDC cleaning or repair services require a separate agreement. You may choose any provider.</p>
          <button type="button" onClick={handleCheckout} disabled={!formData.agreeToTerms || isCheckingOut} className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {isCheckingOut ? (<><Loader2 className="w-5 h-5 animate-spin" /> <T>Opening secure checkout...</T></>) : <><CreditCard className="w-5 h-5" /><T>Continue to Secure Payment</T></>}
          </button>
        </div>
      )}
    </form>
  )
}
