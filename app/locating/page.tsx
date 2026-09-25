'use client'

import { useState, useRef } from 'react'
import { submitInspectionRequest } from '@/lib/request-submission'
import Header from '@/components/header'
import Footer from '@/components/footer'
import Link from 'next/link'
import { 
  MapPin, Phone, Clock, Check, ArrowRight, AlertTriangle, Wrench, 
  Zap, Droplets, Radio, Cable, CircleDot, HelpCircle, Send, Loader2, CheckCircle,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'
import toast, { Toaster } from 'react-hot-toast'
import Image from 'next/image'
import { useLeadCapture } from '@/hooks/use-lead-capture'
import { T, useDiversity } from '@/components/diversity/diversity-provider'

const UTILITIES_WE_LOCATE = [
  'Irrigation system wiring',
  'Invisible dog fence wire',
  'Landscape lighting wiring',
  'Private electrical lines to sheds or garages',
  'Underground conduit',
  'Low-voltage communication wiring',
  'Sewer lines (when traceable with camera sonde)',
  'Drain lines when access is available',
]

const ADDITIONAL_SERVICES = [
  {
    title: 'Invisible Dog Fence Wire Locating',
    icon: Radio,
    description: 'We trace suitable boundary wiring and investigate where a usable signal stops. Repair is separately scoped with a suitable service provider.',
    problems: [
      'Broken boundary wires',
      'Damaged underground connections',
      'System loop break alarms',
      'Wires cut during landscaping',
    ],
    services: [
      'Locating invisible dog fence wire',
      'Identifying wire breaks',
      'Documenting accessible findings',
      'Explaining locating limitations',
    ],
  },
  {
    title: 'Irrigation Wire Locating',
    icon: Droplets,
    description: 'Sprinkler systems rely on low-voltage control wires to operate underground valves.',
    problems: [
      'Broken valve wiring',
      'Damaged underground connections',
      'Lost or buried valve boxes',
    ],
    services: [
      'Locating sprinkler valve wires',
      'Locating irrigation valve boxes',
      'Identifying wiring faults',
      'Documenting the traced route and limitations',
    ],
  },
  {
    title: 'Private Electrical Line Locating',
    icon: Zap,
    description: 'Many homes have underground electrical lines running to detached structures such as garages, sheds, or outdoor buildings.',
    note: 'Electrical repairs must be completed by a licensed electrician.',
    services: [
      'Locating underground electrical lines',
      'Tracing conduit to detached structures',
      'Identifying electrical line paths',
      'Discussing separate exposure work when needed',
    ],
  },
  {
    title: 'Sewer and Septic Line Locating',
    icon: CircleDot,
    description: 'Using sewer camera sonde locating technology we can identify the path of underground sewer lines.',
    uses: [
      'Buried cleanouts',
      'Septic tanks',
      'Septic lines',
      'Sewer laterals',
    ],
  },
  {
    title: 'Drain Line Locating',
    icon: Droplets,
    description: 'Many properties have buried drain systems that can be traced by inserting a fish tape or camera into the pipe.',
    drainTypes: [
      'Downspout drains',
      'French drains',
      'Sump pump discharge lines',
      'Yard drainage systems',
    ],
    accessPoints: [
      'Downspout openings',
      'Sump pump discharge pipes',
      'Cleanouts',
      'Exposed pipe ends',
    ],
    note: 'An accessible entry point is required. If no entry point is available, locating these drains may not be possible.',
  },
]

const EQUIPMENT = [
  'Professional utility locator',
  'Line transmitter (sonde)',
  'Multi-frequency precision locator',
]

const ADDITIONAL_METHODS = [
  'Sewer camera sonde locating',
  'Fish tape tracing',
]

const PUBLIC_UTILITIES = [
  'Gas',
  'Electric',
  'Public water lines',
  'Telecommunications',
  'Municipal sewer',
]

const PRIVATE_UTILITIES = [
  'Irrigation systems',
  'Invisible dog fences',
  'Landscape lighting',
  'Private electrical lines',
  'Propane lines',
  'Pool utilities',
]

const COMMON_REASONS = [
  'Installing fences',
  'Digging for landscaping',
  'Building decks or patios',
  'Installing pools',
  'Trenching or excavation',
  'Irrigation troubleshooting',
  'Locating broken invisible dog fence wire',
]

const FAQS = [
  {
    question: 'What is private utility locating?',
    answer: 'Private utility locating identifies underground utilities located on private property that are not typically marked by the 811 system.',
  },
  {
    question: 'Do I still need to call 811?',
    answer: 'Yes. Indiana law requires contacting 811 before digging.',
  },
  {
    question: 'How much does it cost?',
    answer: 'The base service fee is $125 which includes the first hour of locating service. Additional time is billed at $99 per hour.',
  },
  {
    question: 'Can you locate underground electrical lines?',
    answer: 'We can trace suitable private electrical lines when a usable signal is available. Locating does not include exposure or repair. Discuss excavation separately with IDC or your chosen provider; electrical repairs require a suitable licensed electrician.',
  },
  {
    question: 'Do you repair invisible dog fences?',
    answer: 'PSI focuses on locating the traceable wire and documenting the findings. Repair is a separate scope; tell us what you need and we can discuss an appropriate service provider.',
  },
  {
    question: 'Can you locate buried drain pipes?',
    answer: 'Often yes, but an entry point is required to insert tracing equipment into the pipe.',
  },
  {
    question: 'How long does a locate take?',
    answer: 'Most residential locates take between 30 minutes and 2 hours depending on property size and complexity.',
  },
]

export default function LocatingPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    serviceType: '',
    projectDescription: '',
    preferredDate: '',
  })
  const { captureField, markConverted } = useLeadCapture('utility-locating')
  const { t } = useDiversity()
  const pending = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pending.current) return
    
    if (!formData.name || !formData.phone || !formData.email || !formData.address || !formData.serviceType) {
      toast.error('Please fill in all required fields')
      return
    }

    pending.current = true
    setIsSubmitting(true)

    try {
      await submitInspectionRequest({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `PRIVATE UTILITY LOCATING REQUEST\n\nService Address: ${formData.address}\n\nService Type: ${formData.serviceType}\n\nProject Description: ${formData.projectDescription || 'Not provided'}\n\nPreferred Date: ${formData.preferredDate || 'Flexible'}`,
          source: 'utility-locating',
        })

      {
        markConverted()
        setIsSubmitted(true)
        toast.success('Locate request submitted!')
      }
    } catch {
      toast.error('Delivery was not confirmed. Your entries are still here. Please call (317) 620-3858.')
    } finally {
      pending.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-center" />
      
      {/* Pricing Banner */}
      <div className="bg-accent-500 text-white py-2 px-4 text-center text-sm font-medium">
        <span className="inline-flex items-center gap-2">
          <T>Private utility locates start at $125 for the first hour.</T>
          <Link href="#booking" className="underline hover:no-underline"><T>Request Service →</T></Link>
        </span>
      </div>

      <Header />
      
      <main className="flex-1">
        <section id="sewer-drain" className="section-padding bg-primary-50"><div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-5">Sewer, drain and private utility locating</h1>
          <div className="grid md:grid-cols-2 gap-8">
            <div><h2 className="text-2xl font-semibold mb-3">Following a sewer or drain line</h2><p>PSI uses suitable accessible entry points and a camera sonde or traceable equipment to identify an approximate route, blockage or defect location. Surface markings, footage-counter references and available depth estimates describe what could be traced. We explain signal interference, reach and access limits.</p><p className="mt-4">If you need a buried cleanout located without digging, describe the property and known access first. We confirm whether a non-excavating locate is feasible; an unseen cleanout cannot always be found. Exposure or excavation is separate work through IDC or your chosen provider.</p></div>
            <div><h2 className="text-2xl font-semibold mb-3">Marking and sketching the findings</h2><p>Agree on whether you need a surface mark, a point location or a basic route sketch. These are approximate inspection records, not surveyed coordinates or an engineered map. Depth is an estimate, and a footage counter measures cable travel rather than a precise ground position.</p><p className="mt-4">Private utility locating below concerns suitable traceable private wiring and lines. It does not mean we can find every utility, mark public infrastructure or make a site safe to excavate. Contact Indiana 811 before digging and confirm the required notifications for your work.</p></div>
          </div><Link href="/contact" className="btn-primary mt-6">Discuss a locate or route sketch</Link>
        </div></section>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-amber-600 to-amber-700 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              {/* PLS Logo */}
              <div className="mb-6 flex justify-center">
                <div className="relative w-48 h-48 md:w-56 md:h-56">
                  <Image
                    src="/images/pls_logo.png"
                    alt="Precision Location Services - Private Line Location"
                    fill
                    className="object-contain drop-shadow-lg"
                    priority
                  />
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                <T>Private Utility Locating – Indianapolis</T>
              </h2>
              <p className="text-xl text-amber-100 mb-4">
                <T>Locate underground utilities that 811 does not mark before digging.</T>
              </p>
              <p className="text-amber-200 mb-8">
                <T>Many underground utilities on private property are not marked through the Indiana 811 system. If you are planning to dig for a fence, landscaping project, deck, or excavation, private utilities may still be present even after an 811 locate is completed.</T>
              </p>
              <p className="text-sm text-amber-300 mb-8">
                <MapPin className="w-4 h-4 inline mr-1" />
                <T>Serving Marion County and surrounding counties</T>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="#booking" className="bg-white text-amber-700 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors inline-flex items-center justify-center gap-2">
                  <T>Schedule a Locate</T>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href={`tel:${COMPANY_INFO.phoneRaw}`}
                  className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-400 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  <T>Call Now</T>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-gray-900 text-center mb-4">
              <T>Private Utility Locate Pricing</T>
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mt-10">
              <div className="bg-amber-50 rounded-xl p-8 border-2 border-amber-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2"><T>Base Service Fee</T></h3>
                <div className="text-4xl font-heading font-bold text-amber-600 mb-2">$125</div>
                <p className="text-gray-600"><T>Includes the first hour of locating service.</T></p>
              </div>
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2"><T>Additional Time</T></h3>
                <div className="text-4xl font-heading font-bold text-gray-700 mb-2">$99<span className="text-lg font-normal"><T>/hour</T></span></div>
                <p className="text-gray-600"><T>If more time is required beyond the first hour.</T></p>
              </div>
            </div>
          </div>
        </section>

        {/* What We Locate */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-gray-900 text-center mb-4">
              <T>Utilities We Can Often Locate</T>
            </h2>
            <p className="text-gray-600 text-center mb-10">
              <T>Locating success depends on installation method and whether a traceable signal can be applied.</T>
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {UTILITIES_WE_LOCATE.map((utility, index) => (
                <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span className="text-gray-700"><T>{utility}</T></span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Services */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-gray-900 text-center mb-12">
              <T>Additional Services (Locate + Repair)</T>
            </h2>
            <div className="space-y-8">
              {ADDITIONAL_SERVICES.map((service, index) => {
                const Icon = service.icon
                return (
                  <div key={index} className="bg-gray-50 rounded-xl p-6 md:p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2"><T>{service.title}</T></h3>
                        <p className="text-gray-600 mb-4"><T>{service.description}</T></p>
                        
                        {service.problems && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-800 mb-2"><T>Common problems include:</T></h4>
                            <ul className="grid sm:grid-cols-2 gap-2">
                              {service.problems.map((problem, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                  <T>{problem}</T>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {service.uses && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-800 mb-2"><T>Common uses include locating:</T></h4>
                            <ul className="grid sm:grid-cols-2 gap-2">
                              {service.uses.map((use, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                  <T>{use}</T>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {service.drainTypes && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-800 mb-2"><T>Drain systems we can trace:</T></h4>
                            <ul className="grid sm:grid-cols-2 gap-2">
                              {service.drainTypes.map((drain, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                  <T>{drain}</T>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {service.accessPoints && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-800 mb-2"><T>Entry points include:</T></h4>
                            <ul className="grid sm:grid-cols-2 gap-2">
                              {service.accessPoints.map((point, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                  <T>{point}</T>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {service.services && (
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-2"><T>Services include:</T></h4>
                            <ul className="grid sm:grid-cols-2 gap-2">
                              {service.services.map((svc, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                  <Check className="w-4 h-4 text-amber-600" />
                                  <T>{svc}</T>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {service.note && (
                          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg mt-4">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            <T>{service.note}</T>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Equipment */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-gray-900 text-center mb-4">
              <T>Equipment We Use</T>
            </h2>
            <p className="text-gray-600 text-center mb-10">
              <T>Professional underground locating equipment that allows us to apply a signal to underground utilities and trace their path from the surface.</T>
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <Wrench className="w-8 h-8 text-amber-600 mb-4" />
                <h3 className="font-bold text-gray-900 mb-3"><T>Primary Equipment</T></h3>
                <ul className="space-y-2">
                  {EQUIPMENT.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-600">
                      <Check className="w-4 h-4 text-amber-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <Cable className="w-8 h-8 text-amber-600 mb-4" />
                <h3 className="font-bold text-gray-900 mb-3"><T>Additional Methods</T></h3>
                <ul className="space-y-2">
                  {ADDITIONAL_METHODS.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-600">
                      <Check className="w-4 h-4 text-amber-600" />
                      <T>{item}</T>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why Private Locates */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-gray-900 text-center mb-10">
              <T>Why Private Locates Are Needed</T>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-4"><T>Indiana 811 Marks (Public Utilities)</T></h3>
                <ul className="space-y-2">
                  {PUBLIC_UTILITIES.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-blue-700">
                      <Check className="w-4 h-4" />
                      <T>{item}</T>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <h3 className="font-bold text-amber-900 mb-4"><T>Not Marked by 811 (Private Utilities)</T></h3>
                <ul className="space-y-2">
                  {PRIVATE_UTILITIES.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="w-4 h-4" />
                      <T>{item}</T>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 bg-gray-100 rounded-xl p-6 text-center">
              <p className="text-gray-700">
                <strong><T>Always contact Indiana 811 before digging.</T></strong> <T>Private locating helps identify utilities that are not included in the 811 marking process.</T>
              </p>
            </div>
          </div>
        </section>

        {/* Common Reasons */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-gray-900 text-center mb-10">
              <T>Common Reasons for Locates</T>
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {COMMON_REASONS.map((reason, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <span className="text-gray-700"><T>{reason}</T></span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Marking Method */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-6">
              <T>Marking Method</T>
            </h2>
            <p className="text-gray-600 mb-6">
              <T>Utilities that are successfully located may be marked using:</T>
            </p>
            <div className="flex justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500 rounded-full" />
                <span className="text-gray-700"><T>Temporary marking paint</T></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-8 bg-amber-500 rounded-sm" />
                <span className="text-gray-700"><T>Utility flags</T></span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              <T>Marking method may vary depending on the surface.</T>
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-gray-900 text-center mb-10">
              <T>Frequently Asked Questions</T>
            </h2>
            <div className="space-y-4">
              {FAQS.map((faq, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-semibold text-gray-900 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-amber-600" />
                      <T>{faq.question}</T>
                    </span>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-5 pb-5 pt-0">
                      <p className="text-gray-600 pl-7"><T>{faq.answer}</T></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Section */}
        <section id="booking" className="py-16 bg-amber-600">
          <div className="max-w-2xl mx-auto px-4">
            {isSubmitted ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4"><T>Request Submitted!</T></h2>
                <p className="text-gray-600 mb-6">
                  <T>We&apos;ll contact you shortly to confirm your appointment.</T>
                </p>
                <p className="text-sm text-gray-500">
                  <T>Questions? Call us at</T>{' '}
                  <a href={`tel:${COMPANY_INFO.phoneRaw}`} className="text-amber-600 hover:underline">
                    {COMPANY_INFO.phone}
                  </a>
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-heading font-bold text-white text-center mb-4">
                  <T>Schedule a Locate</T>
                </h2>
                <p className="text-amber-100 text-center mb-8">
                  <T>Fill out the form below and we&apos;ll contact you to confirm your appointment.</T>
                </p>
                <div className="bg-white rounded-2xl p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="locating-name" className="block text-sm font-medium text-gray-700 mb-1">
                          <T>Name</T> <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="locating-name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          name="name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          required
                          autoComplete="name"
                        />
                      </div>
                      <div>
                        <label htmlFor="locating-phone" className="block text-sm font-medium text-gray-700 mb-1">
                          <T>Phone</T> <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="locating-phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          name="phone"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          required
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="locating-email" className="block text-sm font-medium text-gray-700 mb-1">
                        <T>Email</T> <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="locating-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        name="email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        required
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <label htmlFor="locating-address" className="block text-sm font-medium text-gray-700 mb-1">
                        <T>Service Address</T> <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="locating-address"
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        name="address"
                        placeholder={t('Full street address')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        required
                        autoComplete="street-address"
                      />
                    </div>

                    <div>
                      <label htmlFor="locating-serviceType" className="block text-sm font-medium text-gray-700 mb-1">
                        <T>Type of Service Needed</T> <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="locating-serviceType"
                        value={formData.serviceType}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        required
                      >
                        <option value=""><T>Select a service</T></option>
                        <option value="invisible-fence"><T>Invisible Dog Fence Locate/Repair</T></option>
                        <option value="irrigation"><T>Irrigation Wire Locate/Repair</T></option>
                        <option value="electrical"><T>Private Electrical Line Locate</T></option>
                        <option value="sewer-septic"><T>Sewer/Septic Line Locate</T></option>
                        <option value="drain"><T>Drain Line Locate</T></option>
                        <option value="general"><T>General Utility Locate (before digging)</T></option>
                        <option value="other"><T>Other</T></option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="locating-projectDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        <T>Description of Project</T>
                      </label>
                      <textarea
                        id="locating-projectDescription"
                        value={formData.projectDescription}
                        onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                        rows={3}
                        placeholder={t("Describe what you're planning and what utilities you need located")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="locating-preferredDate" className="block text-sm font-medium text-gray-700 mb-1">
                        <T>Preferred Appointment Date</T>
                      </label>
                      <input
                        id="locating-preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <T>Submitting...</T>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <T>Schedule Locate</T>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-8 bg-gray-100">
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-sm text-gray-600 text-center">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              <strong><T>Disclaimer:</T></strong> <T>Utility locating services are provided on a best-effort basis. Not all underground utilities can be detected due to installation methods, depth, soil conditions, signal interference, or lack of tracer wire. Always contact Indiana 811 before digging.</T>
            </p>
          </div>
        </section>

        {/* Contact Bar */}
        <section className="py-6 bg-amber-700 text-white">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <a href={`tel:${COMPANY_INFO.phoneRaw}`} className="flex items-center gap-2 hover:text-amber-200 transition-colors">
              <Phone className="w-5 h-5" />
              {COMPANY_INFO.phone}
            </a>
            <span className="hidden sm:block text-amber-400">|</span>
            <span className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {COMPANY_INFO.city}, {COMPANY_INFO.state}
            </span>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
