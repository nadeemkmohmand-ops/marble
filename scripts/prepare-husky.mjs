/**
 * Installs husky git hooks ONLY when this project lives inside a git repo.
 * Prevents `npm install` failures in CI, sandboxes and downloaded zips
 * (where no .git directory exists).
 */
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

if (existsSync('.git')) {
  try {
    execSync('npx --no-install husky', { stdio: 'inherit' })
  } catch {
    /* husky is optional — ignore failures */
  }
}
