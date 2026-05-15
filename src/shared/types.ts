export type ItemStatus =
  | 'analyzing'
  | 'ready'
  | 'queued'
  | 'downloading'
  | 'completed'
  | 'error'
  | 'canceled'

export interface DownloadItem {
  id: string
  url: string
  webpageUrl: string
  title: string
  thumbnail: string
  sourceDomain: string
  durationSec: number
  status: ItemStatus
  quality: string
  format: string
  availableQualities: string[]
  estimatedBytes: number
  downloadedBytes: number
  totalBytes: number
  progress: number
  speed: number
  eta: number
  phase: string
  filePath: string
  error: string
  addedAt: number
}

export type CookieSource =
  | 'none'
  | 'chrome'
  | 'edge'
  | 'firefox'
  | 'brave'
  | 'opera'
  | 'vivaldi'

export type SortKey = 'added' | 'title' | 'size' | 'duration' | 'status'
export type SortDir = 'asc' | 'desc'

export interface Settings {
  downloadDir: string
  cookieSource: CookieSource
  concurrency: number
  sortKey: SortKey
  sortDir: SortDir
}

export interface ToolStatus {
  ytdlp: boolean
  ffmpeg: boolean
}

export interface AppState {
  items: DownloadItem[]
  settings: Settings
  toolStatus: ToolStatus
}

export interface ItemOptions {
  quality: string
  format: string
}

export interface ToastPayload {
  kind: 'info' | 'error' | 'success'
  message: string
}

export interface AnalyzeResult {
  ok: boolean
  added: number
  error?: string
}

export interface ClipFlowApi {
  analyze(url: string): Promise<AnalyzeResult>
  startDownload(id: string): Promise<void>
  startAll(): Promise<void>
  cancelDownload(id: string): Promise<void>
  retryDownload(id: string): Promise<void>
  removeItem(id: string): Promise<void>
  clearCompleted(): Promise<void>
  setItemOptions(id: string, opts: ItemOptions): Promise<void>
  pickFolder(): Promise<string | null>
  openFolder(path: string): Promise<void>
  openFile(path: string): Promise<void>
  copyText(text: string): Promise<void>
  getState(): Promise<AppState>
  updateSettings(partial: Partial<Settings>): Promise<Settings>
  windowMinimize(): void
  windowMaximizeToggle(): void
  windowClose(): void
  onItemUpsert(cb: (item: DownloadItem) => void): () => void
  onItemRemoved(cb: (id: string) => void): () => void
  onItemsReplace(cb: (items: DownloadItem[]) => void): () => void
  onSettings(cb: (settings: Settings) => void): () => void
  onToast(cb: (toast: ToastPayload) => void): () => void
  onMaximizeChange(cb: (isMaximized: boolean) => void): () => void
}
