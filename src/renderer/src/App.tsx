import { useEffect } from 'react'
import { useStore } from './store'
import TitleBar from './components/TitleBar'
import TopPanel from './components/TopPanel'
import DownloadList from './components/DownloadList'
import StatusBar from './components/StatusBar'
import HelpModal from './components/HelpModal'
import Toasts from './components/Toasts'
import { AlertIcon } from './icons'

function toolMessage(ytdlp: boolean, ffmpeg: boolean): string {
  if (!ytdlp && !ffmpeg) return 'yt-dlp와 ffmpeg를 찾을 수 없습니다. 설치 후 시스템 PATH에 추가하세요.'
  if (!ytdlp) return 'yt-dlp를 찾을 수 없습니다. 설치 후 시스템 PATH에 추가하세요.'
  return 'ffmpeg를 찾을 수 없습니다. 설치 후 시스템 PATH에 추가하세요.'
}

export default function App() {
  const toolStatus = useStore((s) => s.toolStatus)

  useEffect(() => {
    const api = window.clipflow
    const store = (): ReturnType<typeof useStore.getState> => useStore.getState()
    let active = true

    api.getState().then((state) => {
      if (active) store().hydrate(state)
    })

    const offs = [
      api.onItemUpsert((item) => store().upsertItem(item)),
      api.onItemRemoved((id) => store().removeItem(id)),
      api.onItemsReplace((items) => store().replaceItems(items)),
      api.onSettings((settings) => store().setSettings(settings)),
      api.onToast((toast) => store().pushToast(toast)),
      api.onMaximizeChange((value) => store().setMaximized(value))
    ]

    return () => {
      active = false
      offs.forEach((off) => off())
    }
  }, [])

  const toolsMissing = !toolStatus.ytdlp || !toolStatus.ffmpeg

  return (
    <div className="app">
      <TitleBar />
      <main className="content">
        {toolsMissing && (
          <div className="tool-warning" role="alert">
            <AlertIcon size={18} />
            <span>{toolMessage(toolStatus.ytdlp, toolStatus.ffmpeg)}</span>
          </div>
        )}
        <TopPanel />
        <DownloadList />
      </main>
      <StatusBar />
      <HelpModal />
      <Toasts />
    </div>
  )
}
