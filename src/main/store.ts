import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { DownloadItem } from '../shared/types'

function itemsFile(): string {
  return join(app.getPath('userData'), 'items.json')
}

let items: DownloadItem[] = []
let loaded = false
let saveTimer: NodeJS.Timeout | null = null

function persist(): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      writeFileSync(itemsFile(), JSON.stringify(items, null, 2))
    } catch {
      /* best-effort persistence */
    }
  }, 400)
}

export function loadItems(): DownloadItem[] {
  if (loaded) return items
  try {
    if (existsSync(itemsFile())) {
      const raw = JSON.parse(readFileSync(itemsFile(), 'utf-8')) as DownloadItem[]
      items = raw.map((it) => {
        // Downloads interrupted by a previous shutdown cannot resume; reset them.
        if (it.status === 'downloading' || it.status === 'queued') {
          return { ...it, status: 'ready', progress: 0, speed: 0, eta: 0, downloadedBytes: 0 }
        }
        if (it.status === 'analyzing') {
          return { ...it, status: 'error', error: '분석이 완료되지 않았습니다' }
        }
        return it
      })
    }
  } catch {
    items = []
  }
  loaded = true
  return items
}

export function getItems(): DownloadItem[] {
  return loadItems()
}

export function getItem(id: string): DownloadItem | undefined {
  return loadItems().find((i) => i.id === id)
}

export function upsertItem(item: DownloadItem): void {
  loadItems()
  const idx = items.findIndex((i) => i.id === item.id)
  if (idx >= 0) items[idx] = item
  else items.push(item)
  persist()
}

export function patchItem(id: string, patch: Partial<DownloadItem>): DownloadItem | undefined {
  loadItems()
  const idx = items.findIndex((i) => i.id === id)
  if (idx < 0) return undefined
  items[idx] = { ...items[idx], ...patch }
  persist()
  return items[idx]
}

export function removeItem(id: string): void {
  loadItems()
  items = items.filter((i) => i.id !== id)
  persist()
}

export function removeCompleted(): string[] {
  loadItems()
  const removed = items.filter((i) => i.status === 'completed').map((i) => i.id)
  items = items.filter((i) => i.status !== 'completed')
  persist()
  return removed
}
