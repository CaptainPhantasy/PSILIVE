'use client'

import { useEffect, useState } from 'react'
import { FileText, X, ExternalLink, Download } from 'lucide-react'
import { T } from '@/components/diversity/diversity-provider'

export const DEMO_REPORT_URL = '/reports/psi-sample-report-demo-v1.pdf'

interface DemoReportProps {
  /** Optional override for the trigger button's classes (hero vs. inline use). */
  buttonClassName?: string
}

/**
 * "View Sample Report" button + modal with an embedded sample PDF.
 * The 9.4 MB PDF is never loaded until the modal opens (iframe src is set
 * lazily). iOS Safari cannot render PDFs in iframes, so "Open" and "Download"
 * links stay visible at all times inside the modal.
 */
export default function DemoReport({ buttonClassName }: DemoReportProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClassName ?? 'btn-secondary'}
      >
        <FileText className="w-5 h-5" />
        <T>View Sample Report</T>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 md:p-6"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Sample inspection report"
        >
          <div
            className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
                <h2 className="font-heading font-bold text-gray-900 truncate">
                  <T>Sample Inspection Report</T>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Always-visible fallbacks (iOS Safari cannot render PDFs in iframes) */}
            <div className="flex flex-col sm:flex-row gap-2 px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
              <a
                href={DEMO_REPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary justify-center text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <T>Open Sample Report (PDF)</T>
              </a>
              <a
                href={DEMO_REPORT_URL}
                download="psi-sample-report-demo-v1.pdf"
                className="btn-secondary justify-center text-sm"
              >
                <Download className="w-4 h-4" />
                <T>Download PDF</T>
              </a>
            </div>

            {/* Embedded viewer — desktop enhancement, src set lazily on open */}
            <div className="flex-1 min-h-0 bg-gray-100">
              <iframe
                src={DEMO_REPORT_URL}
                title="Sample sewer inspection report (PDF)"
                className="w-full h-full min-h-[50vh]"
              />
            </div>

            {/* Caption */}
            <p className="px-4 sm:px-6 py-3 text-xs text-gray-500 border-t border-gray-200">
              <T>
                This is a fictional demonstration report. The property, people, and findings shown are sample data; the format, detail, and video links are exactly what your buyer receives.
              </T>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
