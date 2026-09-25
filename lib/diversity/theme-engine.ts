/**
 * ThemeEngine — light / dark / system theme switching.
 *
 * Drives Tailwind's class strategy (`darkMode: ['class']`) by toggling the
 * `dark` class on <html>, which also activates the CSS-variable dark theme
 * appended to globals.css. Persists the user's preference and live-syncs to
 * the OS when preference is 'system'. Emits GA4 telemetry on every change.
 *
 * Framework-agnostic: no React imports. The React layer (DiversityProvider)
 * owns one instance and re-renders from its callbacks.
 */
import { emitDiversityEvent } from './telemetry'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'psi-theme'

const PREFERENCES: ThemePreference[] = ['light', 'dark', 'system']

export class ThemeEngine {
  private storageKey: string
  private mediaQuery: MediaQueryList | null = null
  private onSystemChange: (() => void) | null = null
  private listeners = new Set<(p: ThemePreference, r: ResolvedTheme) => void>()

  constructor(config: { storageKey?: string } = {}) {
    this.storageKey = config.storageKey || THEME_STORAGE_KEY
    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    }
  }

  /** Read the stored preference (defaults to 'system'). */
  getPreference(): ThemePreference {
    if (typeof window === 'undefined') return 'system'
    try {
      const stored = window.localStorage.getItem(this.storageKey) as ThemePreference | null
      return stored && PREFERENCES.includes(stored) ? stored : 'system'
    } catch {
      // Storage blocked (privacy mode / sandboxed iframe) — default, no persistence.
      return 'system'
    }
  }

  /** Resolve a preference to the concrete theme that should render. */
  resolve(preference: ThemePreference = this.getPreference()): ResolvedTheme {
    if (preference === 'system') {
      return this.mediaQuery?.matches ? 'dark' : 'light'
    }
    return preference
  }

  /** Apply the current stored preference and start OS sync. Idempotent. */
  init(): void {
    if (typeof window === 'undefined') return
    this.applyToDOM(this.getPreference(), false)

    if (this.mediaQuery && !this.onSystemChange) {
      this.onSystemChange = () => {
        if (this.getPreference() === 'system') {
          this.applyToDOM('system', true)
          this.notify()
        }
      }
      this.mediaQuery.addEventListener('change', this.onSystemChange)
    }
  }

  /** Change the theme preference, persist it, and report telemetry. */
  setPreference(preference: ThemePreference, animate = true): void {
    if (!PREFERENCES.includes(preference)) return
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(this.storageKey, preference)
      } catch {
        // Storage blocked — best-effort persistence only; the theme still applies below.
      }
    }
    this.applyToDOM(preference, animate)
    this.notify()

    emitDiversityEvent({
      event: 'theme_change',
      params: {
        theme_value: preference,
        resolved_theme: this.resolve(preference),
        system_dark_active: this.mediaQuery?.matches ?? false,
      },
    })
  }

  /** Subscribe to preference/resolved-theme changes. Returns an unsubscribe fn. */
  subscribe(fn: (p: ThemePreference, r: ResolvedTheme) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  destroy(): void {
    if (this.mediaQuery && this.onSystemChange) {
      this.mediaQuery.removeEventListener('change', this.onSystemChange)
    }
    this.onSystemChange = null
    this.listeners.clear()
  }

  private notify(): void {
    const pref = this.getPreference()
    const resolved = this.resolve(pref)
    this.listeners.forEach((fn) => fn(pref, resolved))
  }

  private applyToDOM(preference: ThemePreference, animate: boolean): void {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const resolved = this.resolve(preference)

    const commit = () => {
      root.classList.toggle('dark', resolved === 'dark')
      root.setAttribute('data-theme-preference', preference)
    }

    if (animate) {
      root.classList.add('theme-transitioning')
      commit()
      window.setTimeout(() => root.classList.remove('theme-transitioning'), 320)
    } else {
      commit()
    }
  }
}
