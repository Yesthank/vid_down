import { useEffect, useState } from 'react'
import type { DownloadItem } from '../../../shared/types'
import { formatSpeed } from '../format'
import { CheckIcon, AlertIcon } from '../icons'

/** Smoothly climbs toward 90% while analysis runs (analysis has no real progress). */
function useFakeProgress(active: boolean): number {
  const [value, setValue] = useState(10)
  useEffect(() => {
    if (!active) return
    setValue(10)
    const timer = setInterval(() => {
      setValue((prev) => (prev >= 90 ? 90 : prev + Math.max(1, (90 - prev) * 0.14)))
    }, 240)
    return () => clearInterval(timer)
  }, [active])
  return Math.min(90, Math.round(value))
}

export default function StatusBadge({ item }: { item: DownloadItem }) {
  const api = window.clipflow
  const fake = useFakeProgress(item.status === 'analyzing')

  if (item.status === 'analyzing') {
    return (
      <div className="badge-progress">
        <span className="badge-analyzing">분석 중</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${fake}%` }} />
        </div>
        <span className="progress-text">{fake}%</span>
      </div>
    )
  }

  if (item.status === 'downloading') {
    const pct = Math.max(0, Math.min(100, Math.round(item.progress)))
    const speed = formatSpeed(item.speed)
    return (
      <div className="badge-progress">
        <span className="badge-downloading">다운로드 중</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress-text">
          {pct}%{speed ? ` · ${speed}` : ''}
        </span>
      </div>
    )
  }

  if (item.status === 'queued') {
    return <span className="badge badge-queued">대기 중</span>
  }

  if (item.status === 'completed') {
    return (
      <span className="badge badge-completed">
        완료 <CheckIcon size={13} />
      </span>
    )
  }

  if (item.status === 'error') {
    return (
      <button
        className="status-error"
        onClick={() => void api.retryDownload(item.id)}
        title={item.error ? `${item.error} — 다시 시도하려면 클릭` : '다시 시도'}
      >
        <span className="badge badge-error">
          오류 <AlertIcon size={13} />
        </span>
        <span className="error-msg">{item.error || '다시 시도하려면 클릭'}</span>
      </button>
    )
  }

  // ready / canceled — clickable to start the download
  return (
    <button
      className="badge badge-ready"
      onClick={() => void api.startDownload(item.id)}
      title="다운로드 시작"
    >
      준비
    </button>
  )
}
