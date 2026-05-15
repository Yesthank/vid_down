import { useStore } from '../store'
import { LogoIcon, MinimizeIcon, MaximizeIcon, RestoreIcon, CloseIcon } from '../icons'

export default function TitleBar() {
  const isMaximized = useStore((s) => s.isMaximized)
  const api = window.clipflow

  return (
    <div className="titlebar">
      <div className="titlebar-brand">
        <span className="logo">
          <LogoIcon size={16} />
        </span>
        <span className="titlebar-name">ClipFlow</span>
      </div>
      <div className="titlebar-controls">
        <button className="win-btn" onClick={() => api.windowMinimize()} aria-label="최소화">
          <MinimizeIcon size={16} />
        </button>
        <button
          className="win-btn"
          onClick={() => api.windowMaximizeToggle()}
          aria-label={isMaximized ? '이전 크기로' : '최대화'}
        >
          {isMaximized ? <RestoreIcon size={15} /> : <MaximizeIcon size={14} />}
        </button>
        <button className="win-btn win-close" onClick={() => api.windowClose()} aria-label="닫기">
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  )
}
