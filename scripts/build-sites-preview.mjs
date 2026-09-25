import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

// Export the editing site's pages and attach the narrow booking bridge.
// Original application/API routes remain intact for its normal Next.js host.
const root = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const changes = [];
const excluded = new Set(['.git', 'node_modules', '.next', 'out', 'dist', '_quarantine', '.sites-original', '.sites-runtime', '.wrangler', '.yarnrc.yml', 'middleware.ts']);
const sourceFiles = [];
function walk(dir, relative = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(relative, entry.name);
    if (excluded.has(rel.split(path.sep)[0]) || rel.startsWith('app/api') || entry.name.startsWith('.env')) continue;
    if (entry.isDirectory()) walk(path.join(dir, entry.name), rel);
    else if (entry.isFile()) sourceFiles.push(rel);
  }
}
walk(root);

function transform(rel, content) {
  let next = content;
  if (rel === 'app/layout.tsx') {
    next = next.replace("export const dynamic = 'force-dynamic'", "export const dynamic = 'force-static'");
    next = next.replaceAll('index: true,', 'index: false,').replaceAll('follow: true,', 'follow: false,');
  }
  if (rel === 'lib/prisma-timeout.ts') {
    next = 'export async function withDatabaseFallback<T>(_operation: Promise<T>, fallback: T, _timeoutMs = 2000): Promise<T> { return fallback; }\n';
  }
  // The editing host has no AI or analytics server. Do not display a chat
  // control that would send visitors to an unavailable endpoint.
  if (rel === 'components/ai-chat.tsx') next = "export default function AIChat() { return null; }\n";
  if (rel === 'components/site-tracker.tsx') next = "export default function SiteTracker() { return null; }\n";
  if (rel === 'app/sewer-inspection/[slug]/page.tsx') {
    const start = next.indexOf('export async function generateStaticParams()');
    const end = next.indexOf('export default async function Page', start);
    if (start < 0 || end < 0) throw new Error('Service-area source changed; review preview transform.');
    next = next.slice(0, start) + 'export async function generateStaticParams() { return SERVICE_AREA_LINKS.map(({ slug }) => ({ slug })); }\n\n' + next.slice(end);
  }
  if (rel === 'app/robots.ts') next = "export default function robots() { return { rules: { userAgent: '*', disallow: '/' } }; }\n";
  if (rel === 'app/sitemap.ts') next = next.replace('export const revalidate = 3600', "export const dynamic = 'force-static'");
  if (rel === 'tsconfig.json') {
    const config = JSON.parse(next);
    config.include = ['next-env.d.ts', 'app/**/*.ts', 'app/**/*.tsx', '.next/types/**/*.ts'];
    config.exclude = [...(config.exclude || []), 'scripts', 'tests', 'prisma'];
    next = JSON.stringify(config, null, 2) + '\n';
  }
  if (rel === 'app/llms.txt/route.ts') next = "export const dynamic = 'force-static'\n" + next;
  if (next !== content) changes.push({ path: rel, before: content, after: next });
  return next;
}

const stage = dryRun ? null : fs.mkdtempSync(path.join(os.tmpdir(), 'psi-sites-build-'));
for (const rel of sourceFiles) {
  const source = path.join(root, rel);
  const textFile = /\.(tsx?|jsx?|mjs|cjs|json|css|md|ya?ml|txt)$/.test(rel);
  const content = textFile ? transform(rel, fs.readFileSync(source, 'utf8')) : null;
  if (!dryRun) {
    const target = path.join(stage, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (textFile) fs.writeFileSync(target, content); else fs.copyFileSync(source, target);
  }
}

// Client pages using query parameters need a Suspense boundary for export.
for (const rel of sourceFiles.filter(file => /(^|\/)page\.tsx$/.test(file))) {
  const original = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!/^\s*['"]use client['"]/.test(original)) continue;
  const segments = [...rel.matchAll(/\[([^\]]+)\]/g)].map(match => match[1]);
  const params = Object.fromEntries(segments.map(name => [name, 'preview']));
  const exportedTypes = [...original.matchAll(/^export\s+(?:interface|type)\s+(\w+)/gm)].map(match => match[1]);
  const wrapper = "import { Suspense } from 'react';\nimport PageContent from './preview-page-content';\n" +
    (exportedTypes.length ? `export type { ${exportedTypes.join(', ')} } from './preview-page-content';\n` : '') +
    (segments.length ? `export function generateStaticParams() { return [${JSON.stringify(params)}]; }\n` : '') +
    'export default function Page(props: any) { return <Suspense fallback={null}><PageContent {...props} /></Suspense>; }\n';
  changes.push({ path: rel, before: original, after: wrapper });
  if (!dryRun) {
    fs.renameSync(path.join(stage, rel), path.join(stage, path.dirname(rel), 'preview-page-content.tsx'));
    fs.writeFileSync(path.join(stage, rel), wrapper);
  }
}

const config = `const original = require(${JSON.stringify(path.join(root, 'next.config.js'))});
module.exports = { ...original, output: 'export', distDir: '.next', trailingSlash: true,
  experimental: { ...original.experimental, cpus: 2 },
};\n`;
changes.push({ path: 'next.config.js', before: fs.readFileSync(path.join(root, 'next.config.js'), 'utf8'), after: config });
if (dryRun) {
  console.log('DRY RUN: originals are preserved. Changes apply only to a temporary build copy.');
  console.log('Exclude temporary build inputs: app/api, middleware.ts, .env files.');
  for (const change of changes) {
    console.log(`--- original/${change.path}\n+++ preview/${change.path}`);
    // Display the concrete replacement; large originals are retained in Git.
    console.log(change.after.split('\n').map(line => '+' + line).join('\n'));
  }
  process.exit(0);
}

fs.writeFileSync(path.join(stage, 'next.config.js'), config);
fs.symlinkSync(path.join(root, 'node_modules'), path.join(stage, 'node_modules'), 'dir');
console.log(`Preview staging directory: ${stage}`);
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NEXT_OUTPUT_MODE: 'export',
  DATABASE_URL: 'postgresql://preview:preview@127.0.0.1:1/preview?connect_timeout=1',
  NEXT_PUBLIC_GA_MEASUREMENT_ID: '', NODE_ENV: 'production' };
// Never use credentials inherited from a production development shell.
for (const key of Object.keys(env)) {
  if (/(SECRET|API_KEY|ACCESS_KEY|STRIPE|SMTP|GOOGLE.*TOKEN|GOOGLE.*CREDENTIAL)/.test(key)) delete env[key];
}
const build = spawnSync(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build'], { cwd: stage, env, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);
const output = path.join(root, 'out');
if (fs.existsSync(output)) {
  const quarantine = path.join(os.homedir(), '.quarantine', 'psi-sites-preview');
  fs.mkdirSync(quarantine, { recursive: true });
  fs.renameSync(output, path.join(quarantine, `out-${Date.now()}`));
}
fs.cpSync(path.join(stage, 'out'), output, { recursive: true });
const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  const quarantine = path.join(os.homedir(), '.quarantine', 'psi-sites-preview');
  fs.mkdirSync(quarantine, { recursive: true });
  fs.renameSync(dist, path.join(quarantine, `dist-${Date.now()}`));
}
fs.mkdirSync(path.join(dist, 'server'), { recursive: true });
fs.cpSync(output, path.join(dist, 'client'), { recursive: true });
fs.copyFileSync(path.join(root, 'sites/booking-worker.mjs'), path.join(dist, 'server/index.js'));
fs.mkdirSync(path.join(dist, '.openai'), { recursive: true });
fs.copyFileSync(path.join(root, '.openai/hosting.json'), path.join(dist, '.openai/hosting.json'));
console.log(`Sites pages and booking bridge built in ${dist}`);
