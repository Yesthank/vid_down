import { useState } from 'react'
import { useStore } from '../store'
import type { CookieSource } from '../../../shared/types'
import { LinkIcon, FolderIcon, FolderOpenIcon, CookieIcon, HelpIcon, ChevronIcon } from '../icons'

const COOKIE_LABELS: Record<CookieSource, string> = {
  none: '없음',
  chrome: 'Chrome',
  edge: 'Edge',
  firefox: 'Firefox',
  brave: 'Brave',
  opera: 'Opera',
  vivaldi: 'Vivaldi'
}

const COOKIE_KEYS = Object.keys(COOKIE_LABELS) as CookieSource[]

export default function TopPanel() {
  const settings = useStore((s) => s.settings)
  const pushToast = useStore((s) => s.pushToast)
  const setHelpOpen = useStore((s) => s.setHelpOpen)
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const api = window.clipflow

  async function runAnalyze(): Promise<void> {
    const value = url.trim()
    if (!value || analyzing) return
    setAnalyzing(true)
    try {
      const result = await api.analyze(value)
      if (result.ok) {
        setUrl('')
      } else {
        pushToast({ kind: 'error', message: result.error || '분석에 실패했습니다' })
      }
    } catch (e) {
      pushToast({ kind: 'error', message: e instanceof Error ? e.message : '분석에 실패했습니다' })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="panel">
      <div className="url-row">
        <div className="input-wrap">
          <span className="input-icon">
            <LinkIcon size={18} />
          </span>
          <input
            className="text-input"
            type="text"
            placeholder="URL을 입력하세요"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void runAnalyze()
            }}
            spellCheck={false}
          />
        </div>
        <button
          className="btn-primary"
          onClick={() => void runAnalyze()}
          disabled={analyzing || url.trim().length === 0}
        >
          {analyzing ? '분석 중…' : '분석'}
        </button>
      </div>

      <div className="folder-row">
        <button
          className="folder-field"
          onClick={() => void api.pickFolder()}
          title="다운로드 폴더 선택"
        >
          <span className="input-icon">
            <FolderIcon size={18} />
          </span>
          <span className="folder-path">{settings.downloadDir || '폴더를 선택하세요'}</span>
          <span className="folder-open">
            <FolderOpenIcon size={17} />
          </span>
        </button>

        <div className="select-wrap cookie-select">
          <span className="input-icon">
            <CookieIcon size={17} />
          </span>
          <select
            value={settings.cookieSource}
            onChange={(e) => void api.updateSettings({ cookieSource: e.target.value as CookieSource })}
            aria-label="쿠키 소스"
          >
            {COOKIE_KEYS.map((key) => (
              <option key={key} value={key}>
                쿠키: {COOKIE_LABELS[key]}
              </option>
            ))}
          </select>
          <span className="select-chevron">
            <ChevronIcon size={16} />
          </span>
        </div>

        <button className="icon-btn-round" onClick={() => setHelpOpen(true)} aria-label="도움말">
          <HelpIcon size={20} />
        </button>
      </div>
    </div>
  )
}
