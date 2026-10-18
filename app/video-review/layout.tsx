import { pageMetadata } from '@/lib/page-metadata'

export const metadata = pageMetadata(
  '/video-review',
  'Free Sewer Camera Video Second Opinion',
  'Have sewer camera footage from another company? Ask PSI for a free explanation of the visible findings and limits. No inspection or repair purchase is required.',
)

export default function VideoReviewLayout({ children }: { children: React.ReactNode }) {
  return children
}
