import { randomUUID } from 'crypto'
import { statSync } from 'fs'
import type { AnalyzeResult, DownloadItem, ItemOptions } from '../shared/types'
import * as store from './store'
import * as ytdlp from './ytdlp'
import { ensureDir, loadSettings } from './settings'

type Emitter = (channel: string, ...args: unknown[]) => void

let emit: Emitter = () => {}
const handles = new Map<string, ytdlp.DownloadHandle>()

export function setEmitter(fn: Emitter): void {
  emit = fn
}

function emitItem(item: DownloadItem | undefined): void {
  if (item) emit('item-upsert', item)
}

function patch(id: string, patchData: Partial<DownloadItem>): DownloadItem | undefined {
  const updated = store.patchItem(id, patchData)
  emitItem(updated)
  return updated
}

function createItem(partial: Partial<DownloadItem>): DownloadItem {
  return {
    id: randomUUID(),
    url: '',
    webpageUrl: '',
    title: '',
    thumbnail: '',
    sourceDomain: '',
    durationSec: 0,
    status: 'analyzing',
    quality: 'best',
    format: 'mp4',
    availableQualities: ['best'],
    estimatedBytes: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    progress: 0,
    speed: 0,
    eta: 0,
    phase: '',
    filePath: '',
    error: '',
    addedAt: Date.now(),
    ...partial
  }
}

function pickDefaultQuality(qualities: string[]): string {
  if (qualities.includes('1080p')) return '1080p'
  if (qualities.includes('720p')) return '720p'
  return qualities[0] ?? 'best'
}

export async function analyze(url: string): Promise<AnalyzeResult> {
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) {
    return { ok: false, added: 0, error: 'http(s)로 시작하는 올바른 URL을 입력하세요' }
  }

  const placeholder = createItem({ url: trimmed, status: 'analyzing' })
  store.upsertItem(placeholder)
  emitItem(placeholder)

  try {
    const metas = await ytdlp.analyze(trimmed)
    metas.forEach((meta, index) => {
      const base = index === 0 ? placeholder : createItem({})
      const filled: DownloadItem = {
        ...base,
        url: meta.webpageUrl || trimmed,
        webpageUrl: meta.webpageUrl,
        title: meta.title,
        thumbnail: meta.thumbnail,
        sourceDomain: meta.sourceDomain,
        durationSec: meta.durationSec,
        availableQualities: meta.availableQualities,
        quality: pickDefaultQuality(meta.availableQualities),
        format: 'mp4',
        estimatedBytes: meta.estimatedBytes,
        status: 'ready',
        error: ''
      }
      store.upsertItem(filled)
      emitItem(filled)
    })
    return { ok: true, added: metas.length }
  } catch (e) {
    const message = e instanceof Error ? e.message : '분석에 실패했습니다'
    patch(placeholder.id, { status: 'error', error: message })
    return { ok: false, added: 0, error: message }
  }
}

function activeCount(): number {
  return handles.size
}

function pump(): void {
  const { concurrency } = loadSettings()
  if (activeCount() >= concurrency) return
  const queued = store
    .getItems()
    .filter((i) => i.status === 'queued')
    .sort((a, b) => a.addedAt - b.addedAt)
  for (const item of queued) {
    if (activeCount() >= concurrency) break
    startNow(item.id)
  }
}

function startNow(id: string): void {
  const item = store.getItem(id)
  if (!item || handles.has(id)) return
  const settings = loadSettings()
  try {
    ensureDir(settings.downloadDir)
  } catch {
    patch(id, { status: 'error', error: '다운로드 폴더를 만들지 못했습니다' })
    return
  }

  patch(id, {
    status: 'downloading',
    progress: 0,
    speed: 0,
    eta: 0,
    downloadedBytes: 0,
    phase: '준비 중',
    error: ''
  })

  const handle = ytdlp.download(
    {
      url: item.url,
      quality: item.quality,
      format: item.format,
      outputDir: settings.downloadDir,
      cookieSource: settings.cookieSource
    },
    {
      onProgress: (p) => {
        const current = store.getItem(id)
        patch(id, {
          progress: p.progress,
          downloadedBytes: p.downloadedBytes,
          totalBytes: p.totalBytes || current?.totalBytes || 0,
          speed: p.speed,
          eta: p.eta,
          phase: '다운로드 중'
        })
      },
      onPhase: (label) => {
        patch(id, { phase: label })
      },
      onDone: (filePath) => {
        handles.delete(id)
        let size = store.getItem(id)?.totalBytes ?? 0
        try {
          if (filePath) size = statSync(filePath).size
        } catch {
          /* file size lookup is best-effort */
        }
        patch(id, {
          status: 'completed',
          progress: 100,
          speed: 0,
          eta: 0,
          phase: '',
          filePath,
          totalBytes: size,
          downloadedBytes: size
        })
        emit('toast', {
          kind: 'success',
          message: `다운로드 완료: ${store.getItem(id)?.title ?? ''}`
        })
        pump()
      },
      onError: (message) => {
        handles.delete(id)
        const current = store.getItem(id)
        if (current && current.status === 'canceled') {
          pump()
          return
        }
        patch(id, { status: 'error', error: message, speed: 0, eta: 0, phase: '' })
        emit('toast', { kind: 'error', message: `다운로드 실패: ${message}` })
        pump()
      }
    }
  )

  handles.set(id, handle)
}

export function startDownload(id: string): void {
  const item = store.getItem(id)
  if (!item) return
  if (item.status === 'downloading' || item.status === 'queued' || item.status === 'completed') {
    return
  }
  patch(id, { status: 'queued', error: '', progress: 0 })
  pump()
}

export function startAll(): void {
  const startable = store
    .getItems()
    .filter((i) => i.status === 'ready' || i.status === 'error' || i.status === 'canceled')
  for (const item of startable) {
    patch(item.id, { status: 'queued', error: '', progress: 0 })
  }
  pump()
}

export function retryDownload(id: string): void {
  startDownload(id)
}

export function cancelDownload(id: string): void {
  const handle = handles.get(id)
  if (handle) {
    handle.canceled = true
    if (handle.child.pid) ytdlp.killTree(handle.child.pid)
    handles.delete(id)
  }
  const item = store.getItem(id)
  if (item && (item.status === 'downloading' || item.status === 'queued')) {
    patch(id, {
      status: 'ready',
      progress: 0,
      speed: 0,
      eta: 0,
      downloadedBytes: 0,
      phase: ''
    })
  }
  pump()
}

export function removeItem(id: string): void {
  const handle = handles.get(id)
  if (handle) {
    handle.canceled = true
    if (handle.child.pid) ytdlp.killTree(handle.child.pid)
    handles.delete(id)
  }
  store.removeItem(id)
  emit('item-removed', id)
  pump()
}

export function clearCompleted(): void {
  const removed = store.removeCompleted()
  for (const id of removed) emit('item-removed', id)
}

export function setItemOptions(id: string, opts: ItemOptions): void {
  const item = store.getItem(id)
  if (!item) return
  if (item.status === 'downloading' || item.status === 'queued' || item.status === 'completed') {
    return
  }
  patch(id, { quality: opts.quality, format: opts.format })
}

export function getActiveCount(): number {
  return activeCount()
}
