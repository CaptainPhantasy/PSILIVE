import { Metadata } from 'next'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Shield, Database, Share2, Lock, Clock, UserCheck, Mail } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'
import { T } from '@/components/diversity/diversity-provider'

export const metadata: Metadata = {
  title: 'Privacy Policy | Precision Sewer Inspections',
  description: 'Privacy policy for Precision Sewer Inspections. Learn how we collect, use, and protect your personal information.',
  alternates: {
    canonical: '/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                <T>Privacy Policy</T>
              </h1>
              <p className="text-xl text-gray-600">
                <T>How we collect, use, and protect your information</T>
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-gray-600 mb-8">
                <strong><T>Effective Date:</T></strong> March 2026<br />
                <strong><T>Last Updated:</T></strong> March 2026
              </p>

              <p className="text-gray-700 mb-8">
                <T>Precision Sewer Inspection LLC, operating as Precision Sewer Inspections ("we," "us," or "our") operates the website precisionsewerinspections.com and provides sewer inspection services in Central Indiana. This Privacy Policy explains what information we collect, how we use it, and your choices regarding that information.</T>
              </p>

              <p className="text-gray-700 mb-8">Online inspection bookings use PSI's existing booking system, Google Calendar for availability and scheduling, and Stripe for payment. We use the property, access and contact details you provide to arrange your inspection. Separate video-review and locating inquiry forms use FormSubmit to deliver your request to PSI. Mention an existing report or job reference and we will arrange appropriate sharing of inspection media.</p>
              {/* Section 1 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Database className="w-6 h-6 text-primary-600" />
                  <T>1. Information We Collect</T>
                </h2>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3"><T>Information You Provide</T></h3>
                <p className="text-gray-700 mb-3"><T>When you book an inspection or contact us, we collect:</T></p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><strong><T>Contact information:</T></strong> <T>Name, email address, phone number</T></li>
                  <li><strong><T>Property information:</T></strong> <T>Service address, access details, property type</T></li>
                  <li><strong><T>Payment information:</T></strong> <T>When you pay online, your payment is processed by Stripe. We do not store your full credit card number. Stripe handles payment processing and may retain payment details per their privacy policy.</T></li>
                  <li><strong><T>Communications:</T></strong> <T>Messages you send us via our contact form, email, or phone</T></li>
                  <li><strong><T>Service preferences:</T></strong> <T>Scheduling preferences, special instructions, access notes</T></li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3"><T>Information Collected During Service</T></h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><strong><T>Inspection data:</T></strong> <T>Video recordings, photographs, and written observations of the sewer line</T></li>
                  <li><strong><T>Digital signatures:</T></strong> <T>If you sign digitally to acknowledge service completion</T></li>
                  <li><strong><T>Location data:</T></strong> <T>Our technicians may log GPS coordinates during service for operational purposes</T></li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3"><T>Automatically Collected Information</T></h3>
                <p className="text-gray-700 mb-3"><T>When you visit our website, we may collect:</T></p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong><T>Device information:</T></strong> <T>Browser type, operating system, device type</T></li>
                  <li><strong><T>Usage data:</T></strong> <T>Pages visited, time spent on site, referring website</T></li>
                  <li><strong><T>IP address:</T></strong> <T>Used for security and general geographic analytics</T></li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary-600" />
                  <T>2. How We Use Your Information</T>
                </h2>
                <p className="text-gray-700 mb-3"><T>We use the information we collect to:</T></p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong><T>Provide our services:</T></strong> <T>Schedule inspections, perform the inspection, deliver reports and videos</T></li>
                  <li><strong><T>Process payments:</T></strong> <T>Complete transactions you initiate</T></li>
                  <li><strong><T>Communicate with you:</T></strong> <T>Confirm appointments, send reports, respond to inquiries, provide service updates</T></li>
                  <li><strong><T>Improve our services:</T></strong> <T>Understand how our website is used, identify issues, enhance user experience</T></li>
                  <li><strong><T>Maintain records:</T></strong> <T>Keep inspection records for quality assurance and in case of future questions about your property</T></li>
                  <li><strong><T>Comply with legal obligations:</T></strong> <T>Respond to legal requests, enforce our terms, protect our rights</T></li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Share2 className="w-6 h-6 text-primary-600" />
                  <T>3. How We Share Your Information</T>
                </h2>
                <p className="text-gray-700 mb-4"><T>We do not sell your personal information. We may share information with:</T></p>

                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-3"><T>Service Providers</T></h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><strong><T>Payment processing:</T></strong> <T>Stripe processes payments on our behalf. See</T> <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline"><T>Stripe's Privacy Policy</T></a>.</li>
                  <li><strong><T>Email services:</T></strong> <T>We use third-party services to send transactional emails (confirmations, reports)</T></li>
                  <li><strong><T>Cloud storage:</T></strong> <T>Inspection videos and reports are stored with secure cloud providers</T></li>
                  <li><strong><T>Website hosting:</T></strong> <T>Our website is hosted by third-party infrastructure providers</T></li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-3"><T>Other Disclosures</T></h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong><T>With your consent:</T></strong> <T>If you ask us to share your report with a real estate agent, contractor, or other party</T></li>
                  <li><strong><T>Legal requirements:</T></strong> <T>If required by law, court order, or government request</T></li>
                  <li><strong><T>Business transfers:</T></strong> <T>If our business is sold or merged, your information may transfer to the new owner</T></li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Lock className="w-6 h-6 text-primary-600" />
                  <T>4. How We Protect Your Information</T>
                </h2>
                <p className="text-gray-700 mb-3"><T>We use reasonable measures to protect your information, including:</T></p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><T>Secure connections (HTTPS) for data transmission</T></li>
                  <li><T>Encrypted payment processing through Stripe (we never see or store your full card number)</T></li>
                  <li><T>Access controls limiting who can view customer data</T></li>
                  <li><T>Secure cloud storage for inspection files</T></li>
                </ul>
                <p className="text-gray-700">
                  <T>No method of transmission or storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</T>
                </p>
              </div>

              {/* Section 5 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-primary-600" />
                  <T>5. Data Retention</T>
                </h2>
                <p className="text-gray-700 mb-3"><T>We retain your information as follows:</T></p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong><T>Contact and booking information:</T></strong> <T>Retained for as long as needed to provide services and maintain customer relationships</T></li>
                  <li><strong><T>Inspection reports and videos:</T></strong> <T>Retained for a reasonable period to allow you access and for our records. If you need a copy after your download link expires, contact us.</T></li>
                  <li><strong><T>Payment records:</T></strong> <T>Retained as required for accounting and tax purposes</T></li>
                  <li><strong><T>Website analytics:</T></strong> <T>Aggregated data may be retained indefinitely; individual session data is typically retained for limited periods</T></li>
                </ul>
              </div>

              {/* Section 6 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <UserCheck className="w-6 h-6 text-primary-600" />
                  <T>6. Your Choices and Rights</T>
                </h2>
                <p className="text-gray-700 mb-3"><T>You have the following choices regarding your information:</T></p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><strong><T>Access:</T></strong> <T>You can request a copy of the information we have about you</T></li>
                  <li><strong><T>Correction:</T></strong> <T>You can ask us to correct inaccurate information</T></li>
                  <li><strong><T>Deletion:</T></strong> <T>You can ask us to delete your information, subject to our legal and business retention needs</T></li>
                  <li><strong><T>Communications:</T></strong> <T>You can opt out of promotional emails by following unsubscribe instructions (note: you'll still receive transactional emails related to your service)</T></li>
                </ul>
                <p className="text-gray-700">
                  <T>To exercise these rights, contact us at</T> <a href="mailto:support@precisionsewerinspections.com" className="text-primary-600 hover:underline">support@precisionsewerinspections.com</a>.
                </p>
              </div>

              {/* Section 7 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <T>7. Cookies and Tracking</T>
                </h2>
                <p className="text-gray-700 mb-3">
                  <T>Our website may use cookies and similar technologies for:</T>
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><strong><T>Essential functionality:</T></strong> <T>Keeping you logged in, remembering your preferences</T></li>
                  <li><strong><T>Analytics:</T></strong> <T>Understanding how visitors use our site to improve it</T></li>
                </ul>
                <p className="text-gray-700">
                  <T>Most browsers allow you to control cookies through settings. Disabling cookies may affect site functionality.</T>
                </p>
              </div>

              {/* Section 8 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <T>8. Third-Party Links</T>
                </h2>
                <p className="text-gray-700">
                  <T>Our website may contain links to third-party sites (e.g., Google Maps for directions). We are not responsible for the privacy practices of these sites. We encourage you to review their privacy policies.</T>
                </p>
              </div>

              {/* Section 9 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <T>9. Children's Privacy</T>
                </h2>
                <p className="text-gray-700">
                  <T>Our services are not directed at children under 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us.</T>
                </p>
              </div>

              {/* Section 10 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <T>10. Changes to This Policy</T>
                </h2>
                <p className="text-gray-700">
                  <T>We may update this Privacy Policy from time to time. The current version will always be posted on this page with the effective date. Continued use of our services after changes constitutes acceptance of the updated policy.</T>
                </p>
              </div>

              {/* Section 11 - Contact */}
              <div className="bg-gray-50 rounded-xl p-6 mt-12">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Mail className="w-6 h-6 text-primary-600" />
                  <T>Contact Us</T>
                </h2>
                <p className="text-gray-700 mb-4">
                  <T>If you have questions about this Privacy Policy or our data practices, contact us:</T>
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Precision Sewer Inspection LLC</strong></p>
                  <p>{COMPANY_INFO.serviceAreaDisplay}</p>
                  <p><T>Email:</T> <a href="mailto:support@precisionsewerinspections.com" className="text-primary-600 hover:underline">support@precisionsewerinspections.com</a></p>
                  <p><T>Phone:</T> <a href={`tel:${COMPANY_INFO.phoneRaw}`} className="text-primary-600 hover:underline">{COMPANY_INFO.phone}</a></p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
