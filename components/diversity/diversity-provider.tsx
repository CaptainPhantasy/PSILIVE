'use client'

/**
 * DiversityProvider — single client-side owner of the four accessibility /
 * diversity engines (theme, locale, dyslexia, agent). Exposes their state and
 * actions through React context so any component can read or drive them.
 *
 * Localization is render-path (see LocaleEngine): `t()` is a synchronous
 * lookup, and the <T> component fetches-on-miss inside an effect — never
 * during render, never by mutating the DOM. No MutationObserver, no React
 * reconciliation conflicts.
 */
import * as React from 'react'
import { ThemeEngine, type ThemePreference, type ResolvedTheme } from '@/lib/diversity/theme-engine'
import { LocaleEngine, type Locale } from '@/lib/diversity/locale-engine'
import { DyslexiaEngine } from '@/lib/diversity/dyslexia-engine'
import { AgentEngine } from '@/lib/diversity/agent-engine'

interface DiversityContextValue {
  // theme
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  setTheme: (t: ThemePreference) => void
  // locale
  locale: Locale
  setLocale: (l: Locale) => void
  /** Synchronous translation lookup for the current locale (source text → translated, or source on miss). */
  t: (text: string) => string
  /** Resolve a translation, fetching from the proxy on a miss. */
  translateAsync: (text: string) => Promise<string>
  // dyslexia
  dyslexic: boolean
  setDyslexic: (enabled: boolean) => void
  toggleDyslexic: () => void
  // agent
  agentMode: boolean
  setAgentMode: (enabled: boolean) => void
  toggleAgentMode: () => void
}

const DiversityContext = React.createContext<DiversityContextValue | null>(null)

export function DiversityProvider({ children }: { children: React.ReactNode }) {
  // Engines are created once and never re-instantiated.
  const enginesRef = React.useRef<{
    theme: ThemeEngine
    locale: LocaleEngine
    dyslexia: DyslexiaEngine
    agent: AgentEngine
  } | null>(null)
  if (enginesRef.current === null) {
    enginesRef.current = {
      theme: new ThemeEngine(),
      locale: new LocaleEngine(),
      dyslexia: new DyslexiaEngine(),
      agent: new AgentEngine(),
    }
  }
  const engines = enginesRef.current

  const [theme, setThemeState] = React.useState<ThemePreference>('system')
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>('light')
  const [locale, setLocaleState] = React.useState<Locale>('en')
  const [dyslexic, setDyslexicState] = React.useState(false)
  const [agentMode, setAgentModeState] = React.useState(false)
  // Bumped whenever the locale cache gains a new translation, so <T> consumers re-render.
  const [, setLocaleVersion] = React.useState(0)

  React.useEffect(() => {
    const { theme: themeEngine, locale: localeEngine, dyslexia, agent } = engines

    // Initialise from persisted state (the inline head script already painted
    // the correct classes, so this just syncs React state to the DOM).
    themeEngine.init()
    localeEngine.init()
    dyslexia.init()
    agent.init()

    setThemeState(themeEngine.getPreference())
    setResolvedTheme(themeEngine.resolve())
    setLocaleState(localeEngine.getLocale())
    setDyslexicState(dyslexia.isEnabled())
    setAgentModeState(agent.isEnabled())

    const unsubs = [
      themeEngine.subscribe((p, r) => {
        setThemeState(p)
        setResolvedTheme(r)
      }),
      localeEngine.subscribe(() => setLocaleVersion((v) => v + 1)),
      dyslexia.subscribe(setDyslexicState),
      agent.subscribe(setAgentModeState),
    ]

    return () => {
      unsubs.forEach((u) => u())
      themeEngine.destroy()
      localeEngine.destroy()
      dyslexia.destroy()
      agent.destroy()
    }
  }, [engines])

  const value = React.useMemo<DiversityContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (t) => engines.theme.setPreference(t),
      locale,
      setLocale: (l) => {
        engines.locale.setLocale(l)
        setLocaleState(l)
      },
      t: (text) => engines.locale.translateSync(text) ?? text,
      translateAsync: (text) => engines.locale.translateAsync(text),
      dyslexic,
      setDyslexic: (e) => engines.dyslexia.setEnabled(e),
      toggleDyslexic: () => engines.dyslexia.toggle(),
      agentMode,
      setAgentMode: (e) => engines.agent.setEnabled(e),
      toggleAgentMode: () => engines.agent.toggle(),
    }),
    // locale included so consumers re-render on language switch.
    [engines, theme, resolvedTheme, locale, dyslexic, agentMode]
  )

  return <DiversityContext.Provider value={value}>{children}</DiversityContext.Provider>
}

export function useDiversity(): DiversityContextValue {
  const ctx = React.useContext(DiversityContext)
  if (!ctx) {
    throw new Error('useDiversity must be used within a <DiversityProvider>')
  }
  return ctx
}

/**
 * <T> — translate body copy, fetching on a cache miss inside an effect.
 * Renders the English source instantly, then upgrades to the translation when
 * the locale is non-English and a translation resolves.
 *
 *   <T>Book Inspection</T>
 */
export function T({ children }: { children: string }): React.ReactElement {
  const { locale, t, translateAsync } = useDiversity()
  const source = children
  const [value, setValue] = React.useState<string>(() => t(source))

  React.useEffect(() => {
    let active = true
    if (locale === 'en') {
      setValue(source)
      return
    }
    const sync = t(source)
    setValue(sync)
    if (sync === source) {
      translateAsync(source).then((v) => {
        if (active) setValue(v)
      })
    }
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, source])

  return <>{value}</>
}
