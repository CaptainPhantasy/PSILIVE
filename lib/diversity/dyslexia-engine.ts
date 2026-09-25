/**
 * DyslexiaEngine — toggles dyslexia-friendly typography.
 *
 * Sets `data-dyslexic="true"` on <html>, which activates the legible-font +
 * spacing rules appended to globals.css. Pure attribute toggle (no layout
 * mutation), persisted, with GA4 telemetry. Framework-agnostic.
 */
import { emitDiversityEvent } from './telemetry'

export const DYSLEXIA_STORAGE_KEY = 'psi-dyslexic'

export class DyslexiaEngine {
  private storageKey: string
  private listeners = new Set<(enabled: boolean) => void>()

  constructor(config: { storageKey?: string } = {}) {
    this.storageKey = config.storageKey || DYSLEXIA_STORAGE_KEY
  }

  isEnabled(): boolean {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(this.storageKey) === 'true'
    } catch {
      // Storage blocked (privacy mode / sandboxed iframe) — default off.
      return false
    }
  }

  /** Apply the stored state to the DOM. Idempotent. */
  init(): void {
    this.applyToDOM(this.isEnabled())
  }

  setEnabled(enable: boolean): void {
    const state = !!enable
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(this.storageKey, String(state))
      } catch {
        // Storage blocked — best-effort persistence only; state still applies below.
      }
    }
    this.applyToDOM(state)
    this.listeners.forEach((fn) => fn(state))

    emitDiversityEvent({
      event: 'accessibility_toggle',
      params: {
        accessibility_feature: 'dyslexia_font',
        accessibility_status: state,
      },
    })
  }

  toggle(): boolean {
    const next = !this.isEnabled()
    this.setEnabled(next)
    return next
  }

  subscribe(fn: (enabled: boolean) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  destroy(): void {
    this.listeners.clear()
  }

  private applyToDOM(enabled: boolean): void {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-dyslexic', String(enabled))
  }
}
