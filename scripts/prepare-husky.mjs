#!/usr/bin/env node
// Defensive git-hook setup: never fails CI or fresh installs.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
try {
  const huskyDir = resolve(root, '.husky')
  const gitDir = resolve(root, '.git')
  if (!existsSync(gitDir)) {
    console.log('[prepare-husky] No .git directory — skipping hook setup.')
    process.exit(0)
  }
  const husky = await import('husky').catch(() => null)
  if (!husky) {
    console.log('[prepare-husky] husky not installed — skipping hook setup.')
    process.exit(0)
  }
  if (typeof husky.default === 'function') husky.default(root)
  else if (typeof husky.install === 'function') husky.install(root)
  else if (!existsSync(huskyDir)) console.log('[prepare-husky] Nothing to do.')
  console.log('[prepare-husky] Done.')
} catch (err) {
  console.log('[prepare-husky] Skipped:', err?.message || err)
}
