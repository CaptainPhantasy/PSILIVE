import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';

const root = path.resolve('dist/client');
const reportPath = path.resolve(process.argv[2] || '.sites-runtime/accessibility-interactions.json');
const axeSource = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const results = [];
const blockedRequests = [];
const interactionsOnly = process.argv.includes('--interactions-only');
const routeOverride = process.argv.find(arg => arg.startsWith('--route='))?.slice('--route='.length);
const routes = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name === 'index.html') routes.push('/' + path.relative(root, path.dirname(file)).split(path.sep).filter(Boolean).join('/') + '/');
  }
}
walk(root);
const mockDate = new Date();
mockDate.setDate(mockDate.getDate() + 2);
const date = mockDate.toISOString().slice(0, 10);
const availability = [{
  date, dayName: mockDate.toLocaleDateString('en-US', { weekday: 'long' }),
  displayDate: mockDate.toLocaleDateString('en-US'), hasAvailableSlots: true,
  slots: [
    { start: date + 'T14:00:00.000Z', end: date + 'T15:00:00.000Z', display: '10:00 AM', available: true },
    { start: date + 'T16:00:00.000Z', end: date + 'T17:00:00.000Z', display: '12:00 PM', available: false },
  ],
}];
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const fileRoot = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (fileRoot !== root && !fileRoot.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  let file = fileRoot;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
async function createPage(theme, width = 320) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.evaluateOnNewDocument(preference => {
    localStorage.setItem('psi-theme', preference);
    localStorage.setItem('psi-agent-mode', 'false');
    localStorage.setItem('psi-locale', 'en');
    sessionStorage.removeItem('psiBookingDraft');
  }, theme);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    if (!['GET', 'HEAD'].includes(request.method())) {
      blockedRequests.push({ method: request.method(), path: new URL(url).pathname, reason: 'write request blocked' });
      return request.abort();
    }
    if (url.startsWith(origin) && new URL(url).pathname === '/api/calendar/availability') return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, availability }) });
    if (url.startsWith(origin) || url.startsWith('data:')) return request.continue();
    blockedRequests.push({ method: request.method(), host: new URL(url).host, reason: 'external request blocked' });
    return request.abort();
  });
  return page;
}
async function prepare(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[style*="opacity: 0"]').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    document.querySelectorAll('details').forEach(el => { el.open = true; });
    const moreReviews = document.querySelector('#reviews button[aria-expanded="false"]');
    if (moreReviews) moreReviews.click();
  });
}
async function scan(page, name, theme, extra = {}) {
  await prepare(page);
  await new Promise(resolve => setTimeout(resolve, 350));
  if (!await page.evaluate(() => !!window.axe)) await page.addScriptTag({ content: axeSource });
  const report = await page.evaluate(async values => {
    const result = await axe.run(document, { runOnly: { type: 'tag', values } });
    const viewport = document.documentElement.clientWidth;
    const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const overflowing = Array.from(document.querySelectorAll('body *')).filter(el => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0 && r.width > 0 && (r.right > viewport + 2 || r.left < -2);
    }).slice(0, 16).map(el => ({ tag: el.tagName, id: el.id, class: el.className && String(el.className), text: el.textContent?.trim().slice(0, 90), bounds: { left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right } }));
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    return {
      appliedTheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      agentMode: document.documentElement.getAttribute('data-agent-mode') === 'true',
      violations: result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, html: n.html, summary: n.failureSummary })) })),
      incompleteContrast: result.incomplete.filter(v => v.id === 'color-contrast').flatMap(v => v.nodes.map(n => ({ target: n.target, html: n.html, summary: n.failureSummary }))),
      reflow: { viewport, scrollWidth, passes: scrollWidth <= viewport + 2, overflowing: scrollWidth > viewport + 2 ? overflowing : [] },
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content,
      bookingState: document.querySelector('form h2') ? {
        heading: document.querySelector('form h2').textContent.trim(),
        stepHeadingFocused: active === document.querySelector('form h2'),
        headingBounds: { top: document.querySelector('form h2').getBoundingClientRect().top, bottom: document.querySelector('form h2').getBoundingClientRect().bottom },
        headerBottom: document.querySelector('header')?.getBoundingClientRect().bottom,
        focusedHeadingClearOfHeader: active !== document.querySelector('form h2') || document.querySelector('form h2').getBoundingClientRect().top >= (document.querySelector('header')?.getBoundingClientRect().bottom || 0),
        selectedButtons: Array.from(document.querySelectorAll('form button[aria-pressed="true"]')).map(el => ({ text: el.textContent.trim(), label: el.getAttribute('aria-label') })),
        termsExpanded: document.querySelector('form button[aria-controls="booking-terms"]')?.getAttribute('aria-expanded'),
      } : undefined,
      focus: { tag: active?.tagName, label: active?.getAttribute('aria-label'), text: active?.textContent?.trim().slice(0, 90), outline: style?.outline, shadow: style?.boxShadow },
    };
  }, tags);
  results.push({ name, theme, width: page.viewport().width, ...report, ...extra });
  console.log(JSON.stringify({ name, theme, width: page.viewport().width, violations: report.violations.map(v => v.id + ':' + v.nodes.length), reflow: report.reflow.passes }));
}
async function clickText(page, text, container = 'form') {
  const handle = await page.evaluateHandle(({ text, container }) => Array.from(document.querySelectorAll(container + ' button')).find(el => el.textContent.trim() === text), { text, container });
  const el = handle.asElement();
  if (!el) throw new Error('Missing button: ' + text);
  await el.click();
  await handle.dispose();
}
async function type(page, selector, value) {
  await page.focus(selector);
  await page.keyboard.type(value);
}
try {
  browser = await puppeteer.launch({ executablePath: process.env.PSI_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  for (const theme of ['light', 'dark']) {
    const page = await createPage(theme);
    for (const route of routeOverride ? [routeOverride] : interactionsOnly ? [] : routes.sort()) {
      for (const width of routeOverride ? [320, 1440] : [320]) {
        await page.setViewport({ width, height: 900 });
        await page.goto(origin + route.replace('//', '/'), { waitUntil: 'networkidle0' });
        await scan(page, (width === 320 ? 'mobile:' : 'desktop:') + route.replace('//', '/'), theme);
      }
    }
    if (routeOverride) { await page.close(); continue; }
    await page.goto(origin + '/', { waitUntil: 'networkidle0' });
    const menu = await page.$('header button');
    if (!menu) throw new Error('Missing mobile menu button');
    await menu.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('header nav')).some(el => getComputedStyle(el).display !== 'none'));
    const menuState = await menu.evaluate(el => ({ expanded: el.getAttribute('aria-expanded'), controls: el.getAttribute('aria-controls'), controlledElementExists: !!document.getElementById(el.getAttribute('aria-controls') || '') }));
    await page.keyboard.press('Tab');
    const menuTab = await page.evaluate(() => ({ tag: document.activeElement?.tagName, href: document.activeElement?.getAttribute('href'), text: document.activeElement?.textContent }));
    await scan(page, 'mobile-menu-open', theme, { menuState, menuTab });
    await page.keyboard.press('Escape');
    const menuClosed = await menu.evaluate(el => ({ expanded: el.getAttribute('aria-expanded'), focusReturned: document.activeElement === el }));
    results.push({ name: 'mobile-menu-escape', theme, menuClosed });
    await page.goto(origin + '/', { waitUntil: 'networkidle0' });
    const toolbar = await page.$('button[aria-haspopup="dialog"]');
    if (!toolbar) throw new Error('Missing normal-mode accessibility button');
    await toolbar.focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('[role="dialog"]');
    const dialogFocus = await page.evaluate(() => ({ focusEntered: !!document.querySelector('[role="dialog"]')?.contains(document.activeElement), expanded: document.querySelector('button[aria-haspopup="dialog"]')?.getAttribute('aria-expanded'), controls: document.querySelector('button[aria-haspopup="dialog"]')?.getAttribute('aria-controls') }));
    await scan(page, 'accessibility-toolbar-open', theme, { dialogFocus });
    const languageButtons = await page.$$('[role="dialog"] fieldset:nth-of-type(2) button');
    if (languageButtons.length === 2) {
      await languageButtons[1].click();
      await scan(page, 'accessibility-toolbar-spanish', theme);
      await languageButtons[0].click();
    }
    const dyslexiaSwitch = await page.$('[role="dialog"] button[role="switch"]');
    if (dyslexiaSwitch) {
      await dyslexiaSwitch.click();
      await scan(page, 'accessibility-toolbar-dyslexia-enabled', theme);
      await dyslexiaSwitch.click();
    }
    await page.keyboard.press('Escape');
    const toolbarClosed = await toolbar.evaluate(el => ({ expanded: el.getAttribute('aria-expanded'), focusReturned: document.activeElement === el }));
    results.push({ name: 'accessibility-toolbar-escape', theme, toolbarClosed });
    await page.goto(origin + '/faq/', { waitUntil: 'networkidle0' });
    const questions = await page.$$('main section:nth-of-type(2) button');
    for (let i = 0; i < questions.length; i++) {
      if (await questions[i].evaluate(el => el.getAttribute('aria-expanded') !== 'true')) await questions[i].click();
      await new Promise(resolve => setTimeout(resolve, 350));
      const faqState = await questions[i].evaluate(el => ({
        expanded: el.getAttribute('aria-expanded'), controls: el.getAttribute('aria-controls'),
        controlledElementExists: !!document.getElementById(el.getAttribute('aria-controls') || ''),
      }));
      await scan(page, 'faq-question-' + (i + 1), theme, { faqState });
    }
    const search = await page.$('main input');
    if (search) {
      await search.focus();
      await page.keyboard.type('no-match-accessibility-check');
      await scan(page, 'faq-search-no-results', theme);
    }
    for (const width of [320, 1440]) {
      await page.setViewport({ width, height: 900 });
      await page.goto(origin + '/', { waitUntil: 'networkidle0' });
      const opener = await page.$('button[aria-label="Open chat"]');
      if (!opener) {
        results.push({ name: 'chat-unavailable-on-sites-preview', theme, width, reason: 'build-sites-preview.mjs intentionally exports AIChat as null' });
        continue;
      }
      await opener.focus();
      await page.keyboard.press('Enter');
      await page.waitForSelector('button[aria-label="Close chat"]');
      const chatFocus = await page.evaluate(() => ({
        focusedInput: document.activeElement?.tagName === 'INPUT',
        dialogLabel: document.querySelector('[role="dialog"]')?.getAttribute('aria-label'),
        controls: document.querySelector('button[aria-label="Open chat"]')?.getAttribute('aria-controls'),
      }));
      await scan(page, 'chat-open', theme, { chatFocus });
      await page.keyboard.press('Escape');
      const chatClosed = await opener.evaluate(el => ({
        closed: !document.querySelector('button[aria-label="Close chat"]'),
        focusReturned: document.activeElement === el,
      }));
      results.push({ name: 'chat-escape', theme, width, chatClosed });
      // No suggestion click, no message submission, no feedback submission.
    }
    await page.close();
    for (const width of [320, 1440]) {
      const booking = await createPage(theme, width);
      await booking.goto(origin + '/contact/', { waitUntil: 'networkidle0' });
      await booking.waitForSelector('#occupancy');
      await scan(booking, 'booking-job-details', theme);
      await booking.select('#occupancy', 'vacant');
      await type(booking, '#propertyAccess', 'Local accessibility test. No appointment is submitted.');
      await type(booking, '#cleanoutLocation', 'Test cleanout description');
      await booking.click('input[name="accessVerified"]');
      await clickText(booking, 'CONTINUE');
      await booking.waitForFunction(() => Array.from(document.querySelectorAll('form button')).some(el => el.textContent.trim() === '10:00 AM'));
      await scan(booking, 'booking-date-time-unselected', theme);
      await clickText(booking, '10:00 AM');
      await scan(booking, 'booking-date-time-selected', theme);
      await clickText(booking, 'CONTINUE');
      await booking.waitForSelector('#firstName');
      await scan(booking, 'booking-client-details', theme);
      await type(booking, '#firstName', 'Local');
      await type(booking, '#lastName', 'Accessibility');
      await type(booking, '#phone', '3175550100');
      await type(booking, '#email', 'accessibility@example.invalid');
      await type(booking, '#streetAddress', '123 Local Test Street');
      await clickText(booking, 'CONTINUE');
      await booking.waitForFunction(() => !!document.querySelector('input[name="agreeToTerms"]'));
      await scan(booking, 'booking-review', theme);
      await clickText(booking, 'Show Terms of Service');
      await scan(booking, 'booking-review-terms-expanded', theme);
      await booking.click('input[name="agreeToTerms"]');
      await scan(booking, 'booking-review-payment-enabled', theme);
      // Do not click payment. All writes, including lead capture, are blocked above.
      await booking.close();
    }
  }
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({ checkedAt: new Date().toISOString(), routes: routeOverride ? 1 : interactionsOnly ? 0 : routes.length, states: results.length, mockAvailability: availability, blockedRequests, results }, null, 2));
  console.log('Report saved: ' + reportPath);
}
if (results.some(r =>
  r.violations?.length || r.reflow?.passes === false ||
  (r.faqState && (r.faqState.expanded !== 'true' || !r.faqState.controlledElementExists)) ||
  (r.menuState && (r.menuState.expanded !== 'true' || !r.menuState.controlledElementExists)) ||
  (r.menuClosed && (r.menuClosed.expanded !== 'false' || !r.menuClosed.focusReturned)) ||
  (r.dialogFocus && (!r.dialogFocus.focusEntered || r.dialogFocus.expanded !== 'true' || !r.dialogFocus.controls)) ||
  (r.toolbarClosed && (r.toolbarClosed.expanded !== 'false' || !r.toolbarClosed.focusReturned)) ||
  (r.chatFocus && (!r.chatFocus.focusedInput || !r.chatFocus.dialogLabel || !r.chatFocus.controls)) ||
  (r.chatClosed && (!r.chatClosed.closed || !r.chatClosed.focusReturned)) ||
  (['booking-date-time-unselected', 'booking-client-details', 'booking-review'].includes(r.name) && (!r.bookingState?.stepHeadingFocused || !r.bookingState?.focusedHeadingClearOfHeader)) ||
  (r.name === 'booking-date-time-selected' && !r.bookingState?.selectedButtons.some(el => el.text === '10:00 AM'))
)) process.exitCode = 1;
