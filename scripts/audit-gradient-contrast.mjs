import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';

// Check text backgrounds that axe cannot resolve (gradients, images, pseudo elements).
// This samples rendered pixels behind actual text ranges, with the text paint hidden.
const root = path.resolve('dist/client');
const inputPath = process.argv[2] || '.sites-runtime/accessibility-before.json';
const outputPath = process.argv[3] || '.sites-runtime/gradient-contrast-report.json';
const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const representatives = new Map();
for (const state of input.results) {
  for (const rule of state.incomplete || []) {
    for (const node of rule.nodes) {
      const shape = node.html.replace(/>[^<]*</g, '><').replace(/data-agent-(?:id|desc)="[^"]*"/g, '').replace(/href="[^"]*"/g, '');
      const key = state.theme + '|' + shape;
      if (!representatives.has(key)) representatives.set(key, { route: state.route, theme: state.theme, ...node });
    }
  }
}
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname));
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2' };
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
const results = [];
try {
  browser = await puppeteer.launch({ executablePath: process.env.PSI_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true });
  const page = await browser.newPage();
  await page.setViewport({ width:1440, height:1000, deviceScaleFactor:1 });
  await page.setRequestInterception(true);
  page.on('request', request => request.url().startsWith('http://127.0.0.1:') || request.url().startsWith('data:') ? request.continue() : request.abort());
  let previousState = '';
  for (const item of representatives.values()) {
    const state = item.route + '|' + item.theme;
    if (state !== previousState) {
      const preference = await page.evaluateOnNewDocument(theme => {
        localStorage.setItem('psi-theme', theme);
        localStorage.setItem('psi-agent-mode', 'false');
      }, item.theme);
      await page.emulateMediaFeatures([{ name:'prefers-color-scheme', value:item.theme }, { name:'prefers-reduced-motion', value:'reduce' }]);
      await page.goto('http://127.0.0.1:' + server.address().port + item.route, { waitUntil:'networkidle0' });
      await page.removeScriptToEvaluateOnNewDocument(preference.identifier);
      await page.evaluate(() => {
        document.querySelectorAll('details').forEach(e => e.open = true);
        document.querySelectorAll('[style*="opacity: 0"]').forEach(e => { e.style.opacity='1'; e.style.transform='none'; });
      });
      const more = await page.$('#reviews button');
      if (more) await more.click();
      await page.addStyleTag({ content:'[data-contrast-sample], [data-contrast-sample] * { color:transparent!important; -webkit-text-fill-color:transparent!important; text-shadow:none!important; transition:none!important; } [data-contrast-sample] svg { visibility:hidden!important; }' });
      previousState = state;
    }
    const selector = item.target[0];
    let element = await page.$(selector);
    if (!element) {
      const className = item.html.match(/class="([^"]*)"/)?.[1];
      if (className) element = await page.$(item.html.match(/^<([a-z0-9-]+)/i)[1] + "[class=" + JSON.stringify(className) + "]");
    }
    if (!element) { results.push({ ...item, status:'missing-selector' }); continue; }
    await element.evaluate(e => window.scrollTo(0, Math.max(0, e.getBoundingClientRect().top + window.scrollY - 200)));
    // Scroll-triggered motion must finish before measuring actual visible paint.
    await new Promise(resolve => setTimeout(resolve, 800));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const samples = await element.evaluate(e => {
      const samples = [];
      const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        if (!node.textContent.trim() || /^[·→]$/.test(node.textContent.trim())) continue;
        const p = node.parentElement;
        if (p.closest('svg,script,style')) continue;
        const css = getComputedStyle(p);
        if (css.visibility !== 'visible' || css.display === 'none') continue;
        const color = css.color.match(/[\d.]+/g)?.map(Number);
        if (!color || color.length < 3) continue;
        let opacity = color[3] ?? 1;
        for (let ancestor=p; ancestor; ancestor=ancestor.parentElement) opacity *= Number(getComputedStyle(ancestor).opacity);
        const range = document.createRange(); range.selectNodeContents(node);
        const rects = [...range.getClientRects()].filter(r => r.width>0 && r.height>0).map(r => ({ x:r.x+window.scrollX, y:r.y+window.scrollY, width:r.width, height:r.height }));
        const size=Number.parseFloat(css.fontSize), weight=Number.parseInt(css.fontWeight);
        const symbols = !/[a-zA-Z0-9]/.test(node.textContent);
        samples.push({ text:node.textContent.trim(), foreground:color.slice(0,3), opacity, fontSize:size, fontWeight:weight, threshold:symbols?3:(size>=24 || (size>=18.66 && weight>=700)?3:4.5), rects });
      }
      const rects=samples.flatMap(s=>s.rects);
      if (!rects.length) return null;
      const left=Math.max(0,Math.floor(Math.min(...rects.map(r=>r.x)))), top=Math.max(0,Math.floor(Math.min(...rects.map(r=>r.y))));
      const right=Math.ceil(Math.max(...rects.map(r=>r.x+r.width))), bottom=Math.ceil(Math.max(...rects.map(r=>r.y+r.height)));
      const clip={ x:left, y:top, width:Math.max(1,right-left), height:Math.max(1,bottom-top) };
      e.setAttribute('data-contrast-sample','');
      return { samples,clip };
    });
    if (!samples) { results.push({ ...item, status:'no-visible-text' }); continue; }
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const screenshot = await page.screenshot({ type:'png', clip:samples.clip, captureBeyondViewport:true });
    await element.evaluate(e=>e.removeAttribute('data-contrast-sample'));
    const measured = await page.evaluate(async ({data, samples, clip}) => {
      const image = new Image(); image.src='data:image/png;base64,'+data; await image.decode();
      const canvas=document.createElement('canvas'); canvas.width=image.width; canvas.height=image.height;
      const ctx=canvas.getContext('2d'); ctx.drawImage(image,0,0);
      const pixels=ctx.getImageData(0,0,image.width,image.height).data;
      const lum=rgb=>rgb.map(v=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;}).reduce((v,c,i)=>v+c*[0.2126,0.7152,0.0722][i],0);
      return samples.map(sample=>{
        let worst=Infinity, background=null, location=null;
        for(const rect of sample.rects) {
          const x0=Math.max(0,Math.ceil(rect.x-clip.x+1)), x1=Math.min(image.width,Math.floor(rect.x+rect.width-clip.x-1));
          const y0=Math.max(0,Math.ceil(rect.y-clip.y+1)), y1=Math.min(image.height,Math.floor(rect.y+rect.height-clip.y-1));
          for(let y=y0;y<y1;y+=2) for(let x=x0;x<x1;x+=2) {
            const index=(y*image.width+x)*4, bg=[pixels[index],pixels[index+1],pixels[index+2]];
            const fg=sample.foreground.map((v,i)=>v*sample.opacity+bg[i]*(1-sample.opacity));
            const a=lum(fg), b=lum(bg), ratio=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
            if(ratio<worst) { worst=ratio;background=bg;location={x:x+clip.x,y:y+clip.y}; }
          }
        }
        return {...sample,rects:undefined,ratio:Number(worst.toFixed(3)),background,location,passed:worst>=sample.threshold};
      });
    }, {data:Buffer.from(screenshot).toString('base64'),...samples});
    results.push({ route:item.route, theme:item.theme, target:item.target, html:item.html, status:measured.every(s=>s.passed)?'pass':'fail', samples:measured });
    const failures = measured.filter(s=>!s.passed);
    if(failures.length) console.log(JSON.stringify({route:item.route,theme:item.theme,target:item.target,failures:failures.map(s=>({text:s.text.slice(0,100),ratio:s.ratio,threshold:s.threshold,foreground:s.foreground,background:s.background,opacity:s.opacity}))}));
  }
} finally {
  if(browser) await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify({checkedAt:new Date().toISOString(),sourceReport:inputPath,representativeElements:results.length,results},null,2));
console.log(JSON.stringify({report:outputPath,elements:results.length,failed:results.filter(r=>r.status==='fail').length,missing:results.filter(r=>r.status==='missing-selector').length}));
if(results.some(r=>r.status==='fail')) process.exitCode=1;
