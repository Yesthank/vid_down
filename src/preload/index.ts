import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import type {
  AnalyzeResult,
  AppState,
  ClipFlowApi,
  DownloadItem,
  ItemOptions,
  Settings,
  ToastPayload
} from '../shared/types'

function subscribe<T>(channel: string, cb: (payload: T) => void): () => void {
  const handler = (_event: IpcRendererEvent, payload: T): void => cb(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.off(channel, handler)
}

const api: ClipFlowApi = {
  analyze: (url) => ipcRenderer.invoke('analyze', url) as Promise<AnalyzeResult>,
  startDownload: (id) => ipcRenderer.invoke('start-download', id) as Promise<void>,
  startAll: () => ipcRenderer.invoke('start-all') as Promise<void>,
  cancelDownload: (id) => ipcRenderer.invoke('cancel-download', id) as Promise<void>,
  retryDownload: (id) => ipcRenderer.invoke('retry-download', id) as Promise<void>,
  removeItem: (id) => ipcRenderer.invoke('remove-item', id) as Promise<void>,
  clearCompleted: () => ipcRenderer.invoke('clear-completed') as Promise<void>,
  setItemOptions: (id, opts: ItemOptions) =>
    ipcRenderer.invoke('set-item-options', id, opts) as Promise<void>,
  pickFolder: () => ipcRenderer.invoke('pick-folder') as Promise<string | null>,
  openFolder: (path) => ipcRenderer.invoke('open-folder', path) as Promise<void>,
  openFile: (path) => ipcRenderer.invoke('open-file', path) as Promise<void>,
  copyText: (text) => ipcRenderer.invoke('copy-text', text) as Promise<void>,
  getState: () => ipcRenderer.invoke('get-state') as Promise<AppState>,
  updateSettings: (partial: Partial<Settings>) =>
    ipcRenderer.invoke('update-settings', partial) as Promise<Settings>,
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximizeToggle: () => ipcRenderer.send('window-maximize-toggle'),
  windowClose: () => ipcRenderer.send('window-close'),
  onItemUpsert: (cb) => subscribe<DownloadItem>('item-upsert', cb),
  onItemRemoved: (cb) => subscribe<string>('item-removed', cb),
  onItemsReplace: (cb) => subscribe<DownloadItem[]>('items-replace', cb),
  onSettings: (cb) => subscribe<Settings>('settings-changed', cb),
  onToast: (cb) => subscribe<ToastPayload>('toast', cb),
  onMaximizeChange: (cb) => subscribe<boolean>('maximize-change', cb)
}

contextBridge.exposeInMainWorld('clipflow', api)
