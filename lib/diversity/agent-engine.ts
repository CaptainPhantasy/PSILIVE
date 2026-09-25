/**
 * AgentEngine — machine-optimized / agentic DOM mode.
 *
 * When an automated agent (LLM/bot/headless) is detected, or a user opts in,
 * sets `data-agent-mode="true"` on <html> (CSS strips motion + hides flagged
 * decorative nodes) and annotates interactive elements with stable
 * `data-agent-id` / `data-agent-desc` references so agents can address them.
 *
 * DOM annotation only ADDS attributes (never removes/replaces nodes), so it
 * does not fight React reconciliation. It must be invoked post-mount.
 */
import { emitDiversityEvent } from './telemetry'

export const AGENT_STORAGE_KEY = 'psi-agent-mode'

const AGENT_UA_HINTS = [
  'bot',
  'crawler',
  'spider',
  'headless',
  'puppeteer',
  'playwright',
  'lighthouse',
  'gptbot',
  'claudebot',
  'claude-web',
  'anthropic',
  'perplexity',
  'ai-agent',
]

export class AgentEngine {
  private storageKey: string
  private listeners = new Set<(enabled: boolean) => void>()

  constructor(config: { storageKey?: string } = {}) {
    this.storageKey = config.storageKey || AGENT_STORAGE_KEY
  }

  /** True only when the user has explicitly chosen a value. */
  hasStoredPreference(): boolean {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(this.storageKey) !== null
    } catch {
      // Storage blocked (privacy mode / sandboxed iframe) — no stored preference.
      return false
    }
  }

  /** Heuristic detection of a non-human user agent. */
  detectAgent(): boolean {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent.toLowerCase()
    if (AGENT_UA_HINTS.some((hint) => ua.includes(hint))) return true
    // Classic headless signal.
    if ((navigator as unknown as { webdriver?: boolean }).webdriver) return true
    return false
  }

  /** Stored choice if present, else auto-detection. */
  isEnabled(): boolean {
    if (typeof window === 'undefined') return false
    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(this.storageKey)
    } catch {
      // Storage blocked (privacy mode / sandboxed iframe) — fall through to detection.
      stored = null
    }
    if (stored !== null) return stored === 'true'
    return this.detectAgent()
  }

  /** Apply current state and annotate the DOM if active. Idempotent. */
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
      event: 'agent_session_detected',
      params: {
        is_machine_agent: state,
        agent_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
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
    document.documentElement.setAttribute('data-agent-mode', String(enabled))
    if (enabled) this.annotateInteractiveElements()
  }

  /** Add stable, addressable references to interactive elements. Add-only. */
  private annotateInteractiveElements(): void {
    if (typeof document === 'undefined') return
    const nodes = document.querySelectorAll<HTMLElement>('button, a, input, select, textarea')
    nodes.forEach((el, index) => {
      if (!el.hasAttribute('data-agent-id')) {
        el.setAttribute('data-agent-id', `node-${index}`)
      }
      if (!el.hasAttribute('data-agent-desc')) {
        const label =
          el.getAttribute('aria-label') ||
          el.textContent?.trim() ||
          (el as HTMLInputElement).placeholder ||
          ''
        if (label) {
          el.setAttribute('data-agent-desc', label.replace(/\s+/g, ' ').slice(0, 120))
        }
      }
    })
  }
}
