import { spawn } from 'node:child_process'

const args = process.argv.slice(2)
// Managed Sites preview supplies Vite-style flags. Serve the exact built pages
// there with isolated booking fixtures; ordinary local development stays Next.
const managedPreview = args.includes('--strictPort')
const entry = managedPreview ? 'scripts/preview-booking.mjs' : 'node_modules/next/dist/bin/next'
const child = spawn(process.execPath, [entry, ...(managedPreview ? args : ['dev', ...args])], { stdio: 'inherit', env: process.env })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
child.on('exit', code => process.exit(code ?? 1))
