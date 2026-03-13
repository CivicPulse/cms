import { defineConfig, devices } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local so Payload Local API fixtures can access env vars
// (Next.js loads this automatically, but the Playwright worker process does not)
const envLocalPath = resolve(__dirname, '.env.local')
if (existsSync(envLocalPath)) {
  const lines = readFileSync(envLocalPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key && !(key in process.env)) {
      process.env[key] = val
    }
  }
}

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  fullyParallel: false,

  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
