import { BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron'
import type { AppState, ItemOptions, Settings, ToolStatus } from '../shared/types'
import * as manager from './downloadManager'
import * as store from './store'
import { loadSettings, saveSettings } from './settings'
import { checkTools } from './ytdlp'

let toolStatus: ToolStatus = { ytdlp: true, ffmpeg: true }

export async function refreshToolStatus(): Promise<void> {
  toolStatus = await checkTools()
}

export function registerIpc(getWindow: () => BrowserWindow | null): void {
  const send = (channel: string, ...args: unknown[]): void => {
    const win = getWindow()
    if (win && !win.isDestroyed()) win.webContents.send(channel, ...args)
  }
  manager.setEmitter(send)

  ipcMain.handle('analyze', (_e, url: string) => manager.analyze(url))
  ipcMain.handle('start-download', (_e, id: string) => manager.startDownload(id))
  ipcMain.handle('start-all', () => manager.startAll())
  ipcMain.handle('cancel-download', (_e, id: string) => manager.cancelDownload(id))
  ipcMain.handle('retry-download', (_e, id: string) => manager.retryDownload(id))
  ipcMain.handle('remove-item', (_e, id: string) => manager.removeItem(id))
  ipcMain.handle('clear-completed', () => manager.clearCompleted())
  ipcMain.handle('set-item-options', (_e, id: string, opts: ItemOptions) =>
    manager.setItemOptions(id, opts)
  )

  ipcMain.handle('pick-folder', async () => {
    const win = getWindow()
    const options: Electron.OpenDialogOptions = {
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: loadSettings().downloadDir
    }
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || !result.filePaths.length) return null
    const dir = result.filePaths[0]
    const next = saveSettings({ downloadDir: dir })
    send('settings-changed', next)
    return dir
  })

  ipcMain.handle('open-folder', (_e, filePath: string) => {
    if (filePath) shell.showItemInFolder(filePath)
  })
  ipcMain.handle('open-file', async (_e, filePath: string) => {
    if (filePath) await shell.openPath(filePath)
  })
  ipcMain.handle('copy-text', (_e, text: string) => {
    clipboard.writeText(text ?? '')
  })

  ipcMain.handle(
    'get-state',
    (): AppState => ({
      items: store.getItems(),
      settings: loadSettings(),
      toolStatus
    })
  )

  ipcMain.handle('update-settings', (_e, partial: Partial<Settings>) => {
    const next = saveSettings(partial)
    send('settings-changed', next)
    return next
  })

  ipcMain.on('window-minimize', () => getWindow()?.minimize())
  ipcMain.on('window-maximize-toggle', () => {
    const win = getWindow()
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.on('window-close', () => getWindow()?.close())
}
