import { create } from 'zustand'
import type {
  AppState,
  DownloadItem,
  Settings,
  ToastPayload,
  ToolStatus
} from '../../shared/types'

export interface Toast {
  id: number
  kind: ToastPayload['kind']
  message: string
}

const initialSettings: Settings = {
  downloadDir: '',
  cookieSource: 'none',
  concurrency: 3,
  sortKey: 'added',
  sortDir: 'desc'
}

let toastSeq = 0

interface ClipFlowStore {
  items: DownloadItem[]
  settings: Settings
  toolStatus: ToolStatus
  isMaximized: boolean
  toasts: Toast[]
  helpOpen: boolean
  ready: boolean
  hydrate: (state: AppState) => void
  upsertItem: (item: DownloadItem) => void
  removeItem: (id: string) => void
  replaceItems: (items: DownloadItem[]) => void
  setSettings: (settings: Settings) => void
  setMaximized: (value: boolean) => void
  pushToast: (toast: ToastPayload) => void
  dismissToast: (id: number) => void
  setHelpOpen: (value: boolean) => void
}

export const useStore = create<ClipFlowStore>((set) => ({
  items: [],
  settings: initialSettings,
  toolStatus: { ytdlp: true, ffmpeg: true },
  isMaximized: false,
  toasts: [],
  helpOpen: false,
  ready: false,

  hydrate: (state) =>
    set({
      items: state.items,
      settings: state.settings,
      toolStatus: state.toolStatus,
      ready: true
    }),

  upsertItem: (item) =>
    set((s) => {
      const idx = s.items.findIndex((i) => i.id === item.id)
      if (idx < 0) return { items: [...s.items, item] }
      const next = s.items.slice()
      next[idx] = item
      return { items: next }
    }),

  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  replaceItems: (items) => set({ items }),

  setSettings: (settings) => set({ settings }),

  setMaximized: (value) => set({ isMaximized: value }),

  pushToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { id: (toastSeq += 1), kind: toast.kind, message: toast.message }]
    })),

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setHelpOpen: (value) => set({ helpOpen: value })
}))
