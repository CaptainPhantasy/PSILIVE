import { LucideIcon } from 'lucide-react'
import { T } from '@/components/diversity/diversity-provider'

interface SectionHeadingProps {
  label?: string
  title: string
  description?: string
  icon?: LucideIcon
  centered?: boolean
}

export default function SectionHeading({
  label,
  title,
  description,
  icon: Icon,
  centered = true,
}: SectionHeadingProps) {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
      {label && (
        <div className={`flex items-center gap-2 mb-3 ${centered ? 'justify-center' : ''}`}>
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary-600" />
            </div>
          )}
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">
            <T>{label ?? ''}</T>
          </span>
        </div>
      )}
      <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        <T>{title ?? ''}</T>
      </h2>
      {description && (
        <p className={`text-lg text-gray-600 ${centered ? 'max-w-2xl mx-auto' : ''}`}>
          <T>{description ?? ''}</T>
        </p>
      )}
    </div>
  )
}
