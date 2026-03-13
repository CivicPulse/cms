/**
 * Behavioral tests for src/env.ts Zod validation and static payload.config.ts checks.
 *
 * Covers:
 *   - FOUND-01: ZodError thrown when PAYLOAD_SECRET is missing
 *   - FOUND-01: ZodError thrown when PAYLOAD_SECRET is under 32 chars
 *   - FOUND-01: ZodError thrown when DATABASE_URL is missing
 *   - FOUND-06: cleanupAfterTenantDelete: false is present in payload.config.ts
 *
 * Run: npx tsx scripts/test-env-validation.ts
 * No database required — all tests are in-process or subprocess static checks.
 */

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')

let passed = 0
let failed = 0

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  PASS: ${label}`)
    passed++
  } else {
    console.error(`  FAIL: ${label}`)
    if (detail) console.error(`        ${detail}`)
    failed++
  }
}

/**
 * Build a complete valid env suitable for src/env.ts, then allow individual
 * keys to be deleted or overridden. This ensures test failures are attributable
 * to the specific var under test, not an unrelated missing var.
 */
function baseEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    PAYLOAD_SECRET: 'a'.repeat(32),           // 32 chars — valid
    DATABASE_URL: 'postgresql://u:p@localhost/db',
    R2_ENDPOINT: 'abc123.r2.cloudflarestorage.com',
    R2_BUCKET: 'my-bucket',
    R2_ACCESS_KEY_ID: 'access-key-id',
    R2_SECRET_ACCESS_KEY: 'secret-access-key',
    R2_PUBLIC_URL: 'https://media.example.com',
    WEBHOOK_SECRET: 'b'.repeat(32),           // 32 chars — valid
    RUN_API_WEBHOOK_URL: 'https://api.example.com/webhooks',
    RUN_API_BASE_URL: 'https://api.example.com',
    SITE_DOMAIN: 'campaigns.example.com',
  }
}

/**
 * Run a child process that attempts to import src/env.ts with the given env.
 * Returns the exit code and combined stderr output.
 */
function runEnvImport(env: NodeJS.ProcessEnv): { exitCode: number | null; stderr: string } {
  // The inline script simply imports src/env.ts and exits 0.
  // If the import throws (ZodError), tsx surfaces it and exits non-zero.
  const script = `await import(${JSON.stringify(resolve(ROOT, 'src/env.ts'))}); process.exit(0);`

  const result = spawnSync(
    'npx',
    ['tsx', '--input-type=module'],
    {
      input: script,
      env: { ...env, PATH: process.env.PATH },
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 15_000,
    }
  )

  return {
    exitCode: result.status,
    stderr: result.stderr ?? '',
  }
}

console.log('--- FOUND-01: env validation behavioral tests ---\n')

// ---- Test 1: PAYLOAD_SECRET missing → ZodError thrown ----
{
  const env = baseEnv()
  delete env['PAYLOAD_SECRET']

  const { exitCode, stderr } = runEnvImport(env)

  assert(
    exitCode !== 0,
    'startup fails when PAYLOAD_SECRET is missing',
    exitCode === 0 ? 'process exited 0 — expected non-zero' : `exit code: ${exitCode}`,
  )
  assert(
    stderr.includes('PAYLOAD_SECRET'),
    'error message references PAYLOAD_SECRET when it is missing',
    `stderr snippet: ${stderr.slice(0, 300)}`,
  )
}

// ---- Test 2: PAYLOAD_SECRET under 32 chars → ZodError thrown ----
{
  const env = baseEnv()
  env['PAYLOAD_SECRET'] = 'tooshort'   // 8 chars — below the 32-char minimum

  const { exitCode, stderr } = runEnvImport(env)

  assert(
    exitCode !== 0,
    'startup fails when PAYLOAD_SECRET is under 32 characters',
    exitCode === 0 ? 'process exited 0 — expected non-zero' : `exit code: ${exitCode}`,
  )
  assert(
    stderr.includes('PAYLOAD_SECRET') || stderr.includes('32'),
    'error message references PAYLOAD_SECRET or the 32-character limit',
    `stderr snippet: ${stderr.slice(0, 300)}`,
  )
}

// ---- Test 3: DATABASE_URL missing → ZodError thrown ----
{
  const env = baseEnv()
  delete env['DATABASE_URL']

  const { exitCode, stderr } = runEnvImport(env)

  assert(
    exitCode !== 0,
    'startup fails when DATABASE_URL is missing',
    exitCode === 0 ? 'process exited 0 — expected non-zero' : `exit code: ${exitCode}`,
  )
  assert(
    stderr.includes('DATABASE_URL'),
    'error message references DATABASE_URL when it is missing',
    `stderr snippet: ${stderr.slice(0, 300)}`,
  )
}

// ---- Test 4: All required vars present → no error ----
{
  const { exitCode, stderr } = runEnvImport(baseEnv())

  assert(
    exitCode === 0,
    'startup succeeds when all required env vars are present and valid',
    exitCode !== 0 ? `exit code: ${exitCode}\nstderr: ${stderr.slice(0, 300)}` : undefined,
  )
}

console.log('\n--- FOUND-06: static check for cleanupAfterTenantDelete: false ---\n')

// ---- Test 5: cleanupAfterTenantDelete: false is in payload.config.ts ----
{
  const configPath = resolve(ROOT, 'src/payload.config.ts')
  let configContent: string
  try {
    configContent = readFileSync(configPath, 'utf8')
  } catch (err) {
    configContent = ''
    assert(false, 'src/payload.config.ts is readable', String(err))
  }

  const hasCleanupFalse = /cleanupAfterTenantDelete\s*:\s*false/.test(configContent)

  assert(
    hasCleanupFalse,
    'cleanupAfterTenantDelete: false is present in src/payload.config.ts',
    hasCleanupFalse ? undefined : 'Pattern "cleanupAfterTenantDelete: false" not found — may be missing or set to true',
  )
}

// ---- Summary ----
console.log(`\nResults: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
