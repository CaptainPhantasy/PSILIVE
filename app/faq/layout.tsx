import { pageMetadata } from '@/lib/page-metadata'

export const metadata = pageMetadata("/faq", "Sewer Camera Inspection Questions and Answers", "Find answers about PSI sewer camera inspections, access, video, reports, costs and optional next steps. Call (317) 620-3858 to discuss your property.")


export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // FAQPage structured data is emitted by app/faq/page.tsx, which owns the
  // exact rendered FAQ list (schema must match what the page renders).
  return <>{children}</>
}
