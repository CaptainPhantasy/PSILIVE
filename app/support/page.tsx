import { Metadata } from 'next'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Mail, Phone, Clock, FileText, Shield, AlertTriangle, CreditCard, Camera, CheckCircle } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'
import { T } from '@/components/diversity/diversity-provider'

export const metadata: Metadata = {
  title: 'Support & Terms of Service | Precision Sewer Inspections',
  description: 'Get help with your sewer inspection or review our terms of service. Contact support@precisionsewerinspections.com for assistance.',
  alternates: {
    canonical: '/support',
  },
}

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                <T>Support & Terms of Service</T>
              </h1>
              <p className="text-xl text-gray-600">
                <T>Questions? We're here to help. Review our terms below or reach out directly.</T>
              </p>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-primary-50 rounded-2xl p-8 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Mail className="w-6 h-6 text-primary-600" />
                  <T>Contact Support</T>
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900"><T>Email:</T></span>{' '}
                      <a href="mailto:support@precisionsewerinspections.com" className="text-primary-600 hover:underline">
                        support@precisionsewerinspections.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900"><T>Phone:</T></span>{' '}
                      <a href={`tel:${COMPANY_INFO.phoneRaw}`} className="text-primary-600 hover:underline">
                        {COMPANY_INFO.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900"><T>Response Time:</T></span>{' '}
                      <span className="text-gray-600"><T>Within 24 hours</T></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms of Service */}
              <div className="prose prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary-600" />
                  <T>Terms of Service</T>
                </h2>
                <p className="text-gray-600 mb-8">
                  <T>Last updated: March 2026. By booking an inspection with Precision Sewer Inspection LLC, operating as Precision Sewer Inspections, you agree to these terms.</T>
                </p>

                {/* Section 1 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary-600" />
                    <T>1. Scope of Services</T>
                  </h3>
                  <p className="text-gray-700 mb-3">
                    <T>Precision Sewer Inspections provides video camera inspection services for residential and commercial sewer lines. Our services include:</T>
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><T>HD video recording of sewer line interior</T></li>
                    <li><T>Visual identification of observable conditions (cracks, roots, blockages, etc.)</T></li>
                    <li><T>Written summary report with findings</T></li>
                    <li><T>Digital delivery of video and report within one business day (standard) or same-day (if selected)</T></li>
                  </ul>
                  <p className="text-gray-700 mt-3">
                    <strong><T>Inspection findings come first.</T></strong> <T>PSI provides inspection findings and clear reporting. Our sister company, Indiana Drain Company, offers optional cleaning, maintenance, and qualifying repair services. When you ask for guidance, we can discuss practical next steps and a separate quote where appropriate. You may choose IDC, another provider, or no additional service; your findings do not depend on that choice. Cleaning required to improve inspection access is explained, priced, and authorized separately. Declining it may limit the inspection; that limitation is documented.</T>
                  </p>
                </div>

                {/* Section 2 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary-600" />
                    <T>2. Access Requirements</T>
                  </h3>
                  <p className="text-gray-700 mb-3">
                    <T>The customer is responsible for ensuring access to the sewer line at the scheduled appointment time. Acceptable access points include:</T>
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><T>Exterior cleanout (preferred)</T></li>
                    <li><T>Interior cleanout</T></li>
                    <li><T>Roof vent (additional fee applies)</T></li>
                    <li><T>Toilet removal (additional fee applies)</T></li>
                  </ul>
                  <p className="text-gray-700 mt-3">
                    <strong><T>Trip Fee:</T></strong> <T>A $79 trip fee applies if access is unavailable at the scheduled time due to circumstances within the customer's control (locked property, no cleanout access, etc.).</T>
                  </p>
                </div>

                {/* Section 3 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                    <T>3. Pricing & Payment</T>
                  </h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><T>Standard inspection (cleanout access):</T> $159</li>
                    <li><T>Additional units (multi-family):</T> $129 <T>each</T></li>
                    <li><T>Same-day report delivery:</T> +$39</li>
                    <li><T>Roof vent access:</T> +$50</li>
                    <li><T>Toilet pull & reset:</T> +$65</li>
                    <li><T>Crawl space access:</T> +$30</li>
                  </ul>
                  <p className="text-gray-700 mt-3">
                    <T>Payment is due at the time of service or upon online booking. We accept all major credit cards. Prices are subject to change; the price quoted at booking is the price you pay.</T>
                  </p>
                </div>

                {/* Section 4 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-primary-600" />
                    <T>4. Limitations & Disclaimers</T>
                  </h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><strong><T>Visual inspection only:</T></strong> <T>Our cameras document what is visible. We cannot see through walls, soil, or obstructions.</T></li>
                    <li><strong><T>Obstructions:</T></strong> <T>Standing water, debris, or severe blockages may limit visibility. We report what we can see.</T></li>
                    <li><strong><T>No guarantees:</T></strong> <T>Our inspection documents conditions at the time of service. We cannot predict future problems or guarantee the absence of issues not visible during inspection.</T></li>
                    <li><strong><T>Pre-existing conditions:</T></strong> <T>We are not liable for pre-existing damage to sewer lines discovered during inspection.</T></li>
                    <li><strong><T>Third-party reliance:</T></strong> <T>Reports are prepared for the customer who ordered the inspection. We are not responsible for decisions made by third parties based on our reports.</T></li>
                  </ul>
                </div>

                {/* Section 5 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary-600" />
                    <T>5. Cancellation & Rescheduling</T>
                  </h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><T>Cancel or reschedule at least 24 hours before your appointment at no charge.</T></li>
                    <li><T>Cancellations with less than 24 hours notice may be subject to a $50 cancellation fee.</T></li>
                    <li><T>No-shows are subject to the full trip fee ($79).</T></li>
                    <li><T>We reserve the right to reschedule due to weather or equipment issues. You will be notified promptly and given priority rebooking.</T></li>
                  </ul>
                </div>

                {/* Section 6 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    <T>6. Liability</T>
                  </h3>
                  <p className="text-gray-700 mb-3">
                    <T>Precision Sewer Inspection LLC carries general liability insurance. Our liability is limited to the cost of the inspection service. We are not liable for:</T>
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><T>Decisions made based on our findings (repair costs, purchase decisions, etc.)</T></li>
                    <li><T>Conditions not visible or accessible during inspection</T></li>
                    <li><T>Consequential or incidental damages</T></li>
                  </ul>
                </div>

                {/* Section 7 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    <T>7. Privacy & Data</T>
                  </h3>
                  <p className="text-gray-700">
                    <T>We collect contact information and property addresses solely to perform and deliver our services. Video recordings and reports are provided to the customer and retained for our records. We do not sell or share your information with third parties except as required to deliver our services or comply with legal obligations.</T>
                  </p>
                </div>

                {/* Section 8 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    <T>8. Disputes</T>
                  </h3>
                  <p className="text-gray-700">
                    <T>If you have concerns about your inspection or report, please contact us at</T> <a href="mailto:support@precisionsewerinspections.com" className="text-primary-600 hover:underline">support@precisionsewerinspections.com</a>. <T>We are committed to addressing any issues promptly. Any disputes not resolved informally shall be governed by the laws of the State of Indiana.</T>
                  </p>
                </div>

                {/* Section 9 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    <T>9. Changes to Terms</T>
                  </h3>
                  <p className="text-gray-700">
                    <T>We may update these terms from time to time. The current version will always be available on this page. Continued use of our services after changes constitutes acceptance of the updated terms.</T>
                  </p>
                </div>

                {/* Contact */}
                <div className="bg-gray-50 rounded-xl p-6 mt-12">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3"><T>Questions?</T></h3>
                  <p className="text-gray-700">
                    <T>If you have any questions about these terms, please contact us at</T>{' '}
                    <a href="mailto:support@precisionsewerinspections.com" className="text-primary-600 hover:underline font-medium">
                      support@precisionsewerinspections.com
                    </a>{' '}
                    <T>or call</T>{' '}
                    <a href={`tel:${COMPANY_INFO.phoneRaw}`} className="text-primary-600 hover:underline font-medium">
                      {COMPANY_INFO.phone}
                    </a>.
                  </p>
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
