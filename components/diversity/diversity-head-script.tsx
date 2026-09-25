/**
 * Blocking inline script that applies persisted accessibility preferences to
 * <html> BEFORE first paint, eliminating the flash-of-wrong-theme. It mirrors
 * the storage keys used by the engines in lib/diversity/*. Because it mutates
 * <html> attributes that the server did not render, the <html> element must
 * carry `suppressHydrationWarning` (set in app/layout.tsx).
 *
 * Kept dependency-free and tiny; runs synchronously in <head>.
 */
const SCRIPT = String.raw`
(function () {
  try {
    // Backend app boundary: /admin and /technician (the field PWA) must never
    // receive the diversity theme/locale/a11y attributes. Bail before paint.
    if (/^\/(admin|technician)(\/|$)/.test(window.location.pathname)) return;

    var d = document.documentElement;
    var ls = window.localStorage;

    // Theme: 'light' | 'dark' | 'system'
    var pref = ls.getItem('psi-theme') || 'system';
    var mql = window.matchMedia('(prefers-color-scheme: dark)');
    var dark = pref === 'dark' || (pref === 'system' && mql.matches);
    d.classList.toggle('dark', dark);
    d.setAttribute('data-theme-preference', pref);

    // Locale: 'en' | 'es'
    var locale = ls.getItem('psi-locale') || 'en';
    d.setAttribute('lang', locale);

    // Dyslexia-friendly typography
    d.setAttribute('data-dyslexic', ls.getItem('psi-dyslexic') === 'true' ? 'true' : 'false');

    // Agent / machine mode (stored choice wins; else heuristic UA sniff)
    var agentStored = ls.getItem('psi-agent-mode');
    var agent;
    if (agentStored !== null) {
      agent = agentStored === 'true';
    } else {
      var ua = (navigator.userAgent || '').toLowerCase();
      agent = /bot|crawler|spider|headless|puppeteer|playwright|lighthouse|gptbot|claudebot|anthropic|perplexity/.test(ua) || !!navigator.webdriver;
    }
    d.setAttribute('data-agent-mode', agent ? 'true' : 'false');
  } catch (e) { /* localStorage blocked — fall back to default light/en */ }
})();
`

export default function DiversityHeadScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
}
