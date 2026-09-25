// Local QA only. This file is never copied into dist/server. No network writes.
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import worker from '../sites/booking-worker.mjs'

const root = path.resolve('dist/client')
await fs.access(path.join(root, 'index.html'))
const args = process.argv.slice(2)
const arg = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.txt': 'text/plain', '.woff2': 'font/woff2' }

const env = { ASSETS: { async fetch(request) {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url).pathname))
  if (file !== root && !file.startsWith(root + path.sep)) return new Response('Not found', { status: 404 })
  try {
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html')
    return new Response(await fs.readFile(file), { headers: { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' } })
  } catch { return new Response('Not found', { status: 404 }) }
} } }

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://terminal.local:4173')
    if (url.pathname.startsWith('/api/')) {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      if (url.pathname === '/api/calendar/availability' && req.method === 'GET') {
        res.end(await fs.readFile('.sites-runtime/calendar-fixture.json', 'utf8'))
      } else if (url.pathname.startsWith('/api/leads/') && req.method === 'POST') {
        res.end(JSON.stringify({ success: true, previewOnly: true }))
      } else {
        res.statusCode = 503
        res.end(JSON.stringify({ success: false, error: 'Preview verification only. No payment or booking was created.' }))
      }
      return
    }
    const response = await worker.fetch(new Request(url), env)
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch { res.writeHead(500); res.end('Preview error') }
}).listen(Number(arg('--port', '4173')), arg('--host', '0.0.0.0'), () => console.log('Built-site preview ready; all writes are isolated.'))
