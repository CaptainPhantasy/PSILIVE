import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('dist/client')
const canonicalOrigin = 'https://precisionsewerinspections.com'
const rows = []
const failures = []
let localImageReferences = 0
let externalImageReferences = 0
const localImageAssets = new Set()
const noIndexRoute = route => /^\/(?:admin|technician)(?:\/|$)/.test(route) || ['/404', '/maintenance', '/booking/success'].includes(route)
const normalize = url => new URL(url, canonicalOrigin).pathname.replace(/\/$/, '') || '/'
const decode = value => value.replace(/&amp;/g,'&').replace(/&#x27;/g,"'").replace(/&quot;/g,'"')
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name)
    return entry.isDirectory() ? files(full) : [full]
  })
}
function nodes(value) {
  return Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...Object.values(value).flatMap(nodes)] : []
}
for (const file of files(root).filter(file => path.basename(file) === 'index.html')) {
  const route = '/' + path.relative(root, path.dirname(file)).split(path.sep).filter(Boolean).join('/')
  const html = fs.readFileSync(file, 'utf8')
  const meta = name => decode(html.match(new RegExp('<meta (?:name|property)="' + name + '" content="([^"]*)"'))?.[1] || '')
  const title = decode(html.match(/<title>(.*?)<\/title>/)?.[1] || '')
  const description = meta('description')
  const canonical = decode(html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] || '')
  const schemas = []
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { schemas.push(JSON.parse(match[1])) } catch { failures.push(route + ': invalid structured JSON') }
  }
  const row = { route, title, description, canonical, robots: meta('robots'), schemaBlocks: schemas.length }
  rows.push(row)
  for (const element of html.matchAll(/<img\b([^>]*?)>/g)) {
    const src = element[1].match(/\bsrc="([^"]+)"/)?.[1]
    if (!src || /^(data|blob):/.test(src)) continue
    const image = new URL(decode(src), canonicalOrigin)
    if (image.origin !== canonicalOrigin) { externalImageReferences++; continue }
    localImageReferences++
    localImageAssets.add(image.pathname)
    const imageFile = path.join(root, decodeURIComponent(image.pathname))
    if (!fs.existsSync(imageFile) || !fs.statSync(imageFile).isFile() || !fs.statSync(imageFile).size) failures.push(route + ': missing page image ' + image.pathname)
  }
  if (!meta('robots').includes('noindex')) failures.push(route + ': editing copy lacks noindex')
  for (const imageMeta of ['og:image', 'twitter:image']) {
    const imageUrl = meta(imageMeta)
    if (!imageUrl) { failures.push(route + ': missing ' + imageMeta); continue }
    const image = new URL(imageUrl, canonicalOrigin)
    if (image.origin !== canonicalOrigin) { failures.push(route + ': sharing image needs external verification ' + imageUrl); continue }
    const imageFile = path.join(root, decodeURIComponent(image.pathname))
    if (!fs.existsSync(imageFile) || !fs.statSync(imageFile).isFile() || !fs.statSync(imageFile).size) failures.push(route + ': missing sharing image asset ' + image.pathname)
  }
  if (noIndexRoute(route)) continue
  if (!title || !description) failures.push(route + ': missing title or description')
  if (canonical && new URL(canonical).origin !== canonicalOrigin) failures.push(route + ': incorrect canonical origin')
  if (!canonical || normalize(canonical) !== route) failures.push(route + ': canonical does not match page')
  if (normalize(meta('og:url')) !== route) failures.push(route + ': sharing URL does not match page')
  if (!meta('og:description') || !meta('twitter:description')) failures.push(route + ': missing social description')
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) failures.push(route + ': expected one main heading')
  for (const schema of schemas.flatMap(nodes)) {
    if (['LocalBusiness','HomeAndConstructionBusiness'].includes(schema['@type'])) {
      if (schema['@id'] !== canonicalOrigin + '/#organization') failures.push(route + ': inconsistent company identity')
      if (schema.address?.addressLocality !== 'Nashville') failures.push(route + ': incorrect business locality')
      if (schema.aggregateRating) failures.push(route + ': self-serving rating markup')
    }
    if (schema['@type'] === 'SearchAction') failures.push(route + ': phantom site search')
  }
  for (const match of html.matchAll(/<a\s[^>]*href="([^"]*)"/g)) {
    const href = decode(match[1])
    if (!href.startsWith('/') || href.startsWith('//')) continue
    const target = normalize(href)
    if (noIndexRoute(target) || target.startsWith('/api')) continue
    const relative = target.replace(/^\//,'')
    const direct = path.join(root, relative)
    const page = path.join(direct, 'index.html')
    if (!fs.existsSync(direct) && !fs.existsSync(page)) failures.push(route + ': broken internal link ' + href)
  }
}
const publicRows = rows.filter(row => !noIndexRoute(row.route))
const titles = new Map()
for (const row of publicRows) {
  if (titles.has(row.title)) failures.push(row.route + ': duplicate title with ' + titles.get(row.title))
  titles.set(row.title,row.route)
}
const sitemapPath = path.join(root,'sitemap.xml')
if (!fs.existsSync(sitemapPath)) failures.push('Missing sitemap')
else {
  const sitemap = fs.readFileSync(sitemapPath,'utf8')
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>normalize(decode(match[1])))
  for (const row of publicRows) if (!urls.includes(row.route)) failures.push(row.route + ': missing from sitemap')
  for (const route of urls) if (!publicRows.some(row=>row.route===route)) failures.push('Sitemap names unavailable or excluded route: ' + route)
}
if (!fs.readFileSync(path.join(root,'robots.txt'),'utf8').includes('Disallow: /')) failures.push('Editing copy crawler protection missing')
const report = { publicPages: publicRows.length, totalPages: rows.length, localImageReferences, uniqueLocalImageAssets: localImageAssets.size, externalImageReferences, failures: [...new Set(failures)], rows }
fs.mkdirSync('.sites-runtime',{recursive:true})
fs.writeFileSync(process.argv[2] || '.sites-runtime/seo-after.json',JSON.stringify(report,null,2) + '\n')
console.log(JSON.stringify({ publicPages: report.publicPages, totalPages: report.totalPages, localImageReferences, uniqueLocalImageAssets: localImageAssets.size, externalImageReferences, failures: report.failures },null,2))
if (report.failures.length) process.exitCode = 1
