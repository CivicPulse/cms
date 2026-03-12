import { test, expect } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Migration artifact tests (Task 4-01-01, 4-01-02, 4-01-03 — FOUND-02).
 *
 * These are static filesystem assertions — no browser or server needed.
 * They verify that:
 *   - The correct number of migration files exist on disk
 *   - src/migrations/index.ts registers all 3 migrations in chronological order
 *   - The Phase 3 migration .ts file contains the required DDL keywords
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const MIGRATIONS_DIR = resolve(__dirname, '../src/migrations')

test.describe('Migration artifacts @smoke', () => {

  // Task 4-01-01: migration file count
  test('src/migrations contains exactly 4 .ts files and 3 .json files', () => {
    const files = readdirSync(MIGRATIONS_DIR)

    const tsFiles = files.filter(f => f.endsWith('.ts'))
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    // 3 migration .ts files + index.ts = 4 total
    expect(tsFiles).toHaveLength(4)
    // One .json snapshot per migration = 3 total
    expect(jsonFiles).toHaveLength(3)

    // index.ts must be present
    expect(tsFiles).toContain('index.ts')

    // Each .json must have a corresponding .ts migration (same stem)
    for (const json of jsonFiles) {
      const stem = json.replace('.json', '')
      expect(tsFiles).toContain(`${stem}.ts`)
    }
  })

  // Task 4-01-03: index.ts registers all 3 migrations in chronological order
  test('src/migrations/index.ts registers all 3 migrations in chronological order', () => {
    const indexPath = resolve(MIGRATIONS_DIR, 'index.ts')
    const content = readFileSync(indexPath, 'utf8')

    const expectedMigrations = [
      '20260311_143013',
      '20260312_001714',
      '20260312_181402',
    ]

    // All three migration names must appear in index.ts
    for (const name of expectedMigrations) {
      expect(content, `index.ts should reference migration ${name}`).toContain(name)
    }

    // The migrations must appear in chronological order within the file
    const positions = expectedMigrations.map(name => content.indexOf(name))
    for (let i = 1; i < positions.length; i++) {
      expect(
        positions[i],
        `migration ${expectedMigrations[i]} must appear after ${expectedMigrations[i - 1]} in index.ts`
      ).toBeGreaterThan(positions[i - 1])
    }

    // The migrations array must export all three (up + down + name per entry)
    const upMatches = content.match(/\bup:/g)
    expect(upMatches, 'migrations array should have 3 up: entries').toHaveLength(3)

    const downMatches = content.match(/\bdown:/g)
    expect(downMatches, 'migrations array should have 3 down: entries').toHaveLength(3)
  })

  // Task 4-01-02 (automated portion): Phase 3 migration DDL keyword check
  test('Phase 3 migration contains required DDL keywords for all schema changes', () => {
    const migrationPath = resolve(MIGRATIONS_DIR, '20260312_181402.ts')
    const content = readFileSync(migrationPath, 'utf8')

    // _posts_v table — from versions: { drafts: true } on Posts collection
    expect(content, 'should CREATE TABLE _posts_v for versions/drafts').toContain('_posts_v')

    // _status column — draft/published enum on posts table
    expect(content, 'should add _status column to posts').toContain('_status')

    // featured_image_id column — upload relationship to media on posts table
    expect(content, 'should add featured_image_id column to posts').toContain('featured_image_id')

    // site_settings_nav_items table — repeating navItems array on SiteSettings
    expect(content, 'should CREATE TABLE site_settings_nav_items for navItems').toContain('site_settings_nav_items')

    // Defensive _status backfill (as documented in PLAN and SUMMARY)
    expect(content, 'should include defensive _status backfill UPDATE statement').toContain(
      `UPDATE "posts" SET "_status" = 'published' WHERE "_status" IS NULL`
    )
  })

})
