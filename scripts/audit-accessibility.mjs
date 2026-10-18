import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';

const root = path.resolve('dist/client');
const reportPath = path.resolve(process.argv[2] || '.sites-runtime/accessibility-report.json');
const axeSource = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const routes = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name === 'index.html') {
      routes.push('/' + path.relative(root, path.dirname(file)).split(path.sep).join('/') + '/');
    }
  }
}
walk(root);
const routeOption = process.argv.find(arg => arg.startsWith('--route='))?.slice(8);
const selectedRoutes = routes.sort().filter(route => {
  const normalized = route.replace('//', '/');
  if (process.argv.includes('--staff-only') && !/^\/(admin|technician)(\/|$)/.test(normalized)) return false;
  return !routeOption || normalized === routeOption;
});
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
const results = [];
try {
  browser = await puppeteer.launch({ executablePath: process.env.PSI_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on('request', request => request.url().startsWith('http://127.0.0.1:') || request.url().startsWith('data:') ? request.continue() : request.abort());
  for (const route of selectedRoutes) {
    for (const theme of ['light', 'dark']) {
      const preferenceScript = await page.evaluateOnNewDocument(preference => {
        localStorage.setItem('psi-theme', preference);
        localStorage.setItem('psi-agent-mode', 'false');
      }, theme);
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.goto('http://127.0.0.1:' + server.address().port + route.replace('//', '/'), { waitUntil: 'networkidle0' });
      await page.evaluate(() => {
        document.querySelectorAll('details').forEach(el => { el.open = true; });
        document.querySelectorAll('[style*="opacity: 0"]').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
      });
      const more = await page.$('#reviews button');
      if (more) await more.click();
      await page.removeScriptToEvaluateOnNewDocument(preferenceScript.identifier);
      // Staff apps deliberately opt out of customer theme preferences. Exercise
      // their CSS in both themes without changing that application boundary.
      const forcedStaffTheme = /^\/(admin|technician)(\/|$)/.test(route);
      if (forcedStaffTheme) {
        await page.evaluate(preference => document.documentElement.classList.toggle('dark', preference === 'dark'), theme);
      } else {
        await page.waitForFunction(preference => document.documentElement.classList.contains('dark') === (preference === 'dark'), {}, theme);
      }
      // Let control color transitions finish before measuring contrast.
      await new Promise(resolve => setTimeout(resolve, 400));
      await page.addScriptTag({ content: axeSource });
      const result = await page.evaluate(async () => {
        const report = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
        return {
          appliedTheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
          violations: report.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ target: n.target, html: n.html, summary: n.failureSummary, checks: [...n.any, ...n.all, ...n.none].map(c => ({ id: c.id, data: c.data })) })) })),
          incomplete: report.incomplete.filter(v => v.id === 'color-contrast').map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, html: n.html, summary: n.failureSummary })) })),
        };
      });
      results.push({ route: route.replace('//', '/'), theme, forcedStaffTheme, ...result });
      if (result.appliedTheme !== theme) throw new Error('Theme did not apply: ' + route + ' ' + theme);
      console.log(JSON.stringify({ route: route.replace('//', '/'), theme, violations: result.violations.map(v => v.id + ':' + v.nodes.length) }));
    }
  }
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify({ checkedAt: new Date().toISOString(), routes: selectedRoutes.length, states: results.length, results }, null, 2));
console.log('Report saved: ' + reportPath);
if (results.some(r => r.violations.length)) process.exitCode = 1;
