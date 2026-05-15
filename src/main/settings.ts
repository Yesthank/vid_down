import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import type { Settings } from '../shared/types'

function settingsFile(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function defaults(): Settings {
  return {
    downloadDir: join(app.getPath('videos'), 'ClipFlow'),
    cookieSource: 'none',
    concurrency: 3,
    sortKey: 'added',
    sortDir: 'desc'
  }
}

let cache: Settings | null = null

export function loadSettings(): Settings {
  if (cache) return cache
  try {
    if (existsSync(settingsFile())) {
      const raw = JSON.parse(readFileSync(settingsFile(), 'utf-8'))
      cache = { ...defaults(), ...raw }
    } else {
      cache = defaults()
    }
  } catch {
    cache = defaults()
  }
  return cache as Settings
}

export function saveSettings(partial: Partial<Settings>): Settings {
  const next: Settings = { ...loadSettings(), ...partial }
  next.concurrency = Math.min(8, Math.max(1, Math.round(next.concurrency)))
  cache = next
  try {
    writeFileSync(settingsFile(), JSON.stringify(next, null, 2))
  } catch {
    /* persisting settings is best-effort */
  }
  return next
}

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}
