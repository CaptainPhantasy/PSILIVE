'use client'

/**
 * DiversityToolbar — floating control surface for the accessibility / diversity
 * engines. Bottom-left so it never collides with the bottom-right AI chat +
 * toast stack. All copy runs through the locale layer, so the toolbar itself is
 * bilingual. Marked data-agent-hidden so it is removed in machine/agent mode.
 */
import * as React from 'react'
import {
  Accessibility,
  Sun,
  Moon,
  Monitor,
  Languages,
  Type,
  Bot,
  X,
  Check,
} from 'lucide-react'
import { useDiversity } from './diversity-provider'
import type { ThemePreference } from '@/lib/diversity/theme-engine'
import type { Locale } from '@/lib/diversity/locale-engine'

export default function DiversityToolbar() {
  const {
    theme,
    setTheme,
    locale,
    setLocale,
    dyslexic,
    toggleDyslexic,
    agentMode,
    toggleAgentMode,
    t,
  } = useDiversity()

  const [open, setOpen] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  // Close on Escape and on outside click.
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const themeOptions: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: t('Light'), icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: t('Dark'), icon: <Moon className="w-4 h-4" /> },
    { value: 'system', label: t('System'), icon: <Monitor className="w-4 h-4" /> },
  ]

  const localeOptions: { value: Locale; label: string }[] = [
    { value: 'en', label: t('English') },
    { value: 'es', label: t('Spanish') },
  ]

  return (
    <>
      {/* Escape hatch: agent mode hides the whole toolbar (data-agent-hidden),
          so without this there is no UI left to turn the mode back off. This
          button is deliberately NOT flagged data-agent-hidden. */}
      {agentMode && (
        <button
          type="button"
          onClick={toggleAgentMode}
          aria-label={t('Exit agent mode')}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-primary-700 px-4 py-3 text-xs font-semibold text-white shadow-lg hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-500/40 transition-colors"
        >
          <X className="w-4 h-4" />
          {t('Exit agent mode')}
        </button>
      )}
      <div className="fixed bottom-6 left-6 z-50" data-agent-hidden>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t('Accessibility & language options')}
          className="absolute bottom-16 left-0 w-72 max-w-[calc(100vw-48px)] rounded-2xl bg-white text-gray-900 shadow-2xl border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Accessibility className="w-4 h-4 text-primary-700" />
              {t('Accessibility')}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('Close')}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Theme */}
          <fieldset className="mb-4">
            <legend className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" /> {t('Theme')}
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  aria-pressed={theme === opt.value}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    theme === opt.value
                      ? 'border-primary-500 bg-primary-50 text-primary-800'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Language */}
          <fieldset className="mb-4">
            <legend className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5" /> {t('Language')}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {localeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLocale(opt.value)}
                  aria-pressed={locale === opt.value}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    locale === opt.value
                      ? 'border-primary-500 bg-primary-50 text-primary-800'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {locale === opt.value && <Check className="w-3.5 h-3.5" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Toggles */}
          <div className="space-y-2">
            <ToggleRow
              icon={<Type className="w-4 h-4" />}
              label={t('Dyslexia-friendly text')}
              checked={dyslexic}
              onChange={toggleDyslexic}
            />
            <ToggleRow
              icon={<Bot className="w-4 h-4" />}
              label={t('Machine / agent mode')}
              checked={agentMode}
              onChange={toggleAgentMode}
            />
          </div>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('Accessibility & language options')}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-700 text-white shadow-lg hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-500/40 transition-colors"
      >
        <Accessibility className="w-6 h-6" />
      </button>
      </div>
    </>
  )
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}
