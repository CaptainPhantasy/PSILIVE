import { pageMetadata } from '@/lib/page-metadata'

export const metadata = pageMetadata(
  '/locating',
  'Private Utility and Sewer Line Locating',
  'Locate suitable private utilities and accessible sewer or drain lines with PSI. Discuss access, traceability and the limits of a locate before scheduling.',
)

export default function LocatingLayout({ children }: { children: React.ReactNode }) {
  return children
}
