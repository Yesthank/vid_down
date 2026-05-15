import { useEffect, useRef, useState } from 'react'
import type { DownloadItem, ItemStatus } from '../../../shared/types'
import { useStore } from '../store'
import { formatBytes, formatDuration } from '../format'
import StatusBadge from './StatusBadge'
import {
  ChevronIcon,
  ClockIcon,
  DotsIcon,
  FileIcon,
  FolderOpenIcon,
  PlayIcon,
  TrashIcon,
  XIcon,
  YoutubeIcon
} from '../icons'

const FORMAT_OPTIONS = ['mp4', 'webm', 'mkv', 'mp3', 'm4a']
const AUDIO_FORMATS = new Set(['mp3', 'm4a'])
const LOCKED: ItemStatus[] = ['downloading', 'queued', 'completed']

interface MenuPos {
  top: number
  right: number
  up: boolean
}

function sizeLabel(item: DownloadItem): string {
  if ((item.status === 'completed' || item.status === 'downloading') && item.totalBytes > 0) {
    return formatBytes(item.totalBytes)
  }
  if (item.estimatedBytes > 0) return formatBytes(item.estimatedBytes)
  return '—'
}

export default function DownloadRow({ item }: { item: DownloadItem }) {
  const api = window.clipflow
  const pushToast = useStore((s) => s.pushToast)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null)
  const [imgError, setImgError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<HTMLButtonElement>(null)

  const editable = !LOCKED.includes(item.status)
  const isAudio = AUDIO_FORMATS.has(item.format)
  const canCancel = item.status === 'downloading' || item.status === 'queued'
  const hasFile = item.status === 'completed' && item.filePath.length > 0
  const qualities = item.availableQualities.length > 0 ? item.availableQualities : ['best']

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const close = (): void => setMenuOpen(false)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [menuOpen])

  function toggleMenu(): void {
    if (menuOpen) {
      setMenuOpen(false)
      return
    }
    const btn = dotsRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const up = r.bottom > window.innerHeight - 250
    setMenuPos({
      top: up ? r.top : r.bottom,
      right: Math.max(8, window.innerWidth - r.right),
      up
    })
    setMenuOpen(true)
  }

  function changeQuality(quality: string): void {
    void api.setItemOptions(item.id, { quality, format: item.format })
  }

  function changeFormat(format: string): void {
    void api.setItemOptions(item.id, { quality: item.quality, format })
  }

  function copyUrl(): void {
    void api.copyText(item.webpageUrl || item.url)
    pushToast({ kind: 'info', message: 'URL을 클립보드에 복사했습니다' })
  }

  return (
    <div className={`row status-${item.status}`}>
      <div className="col-video cell-video">
        <div className="thumb">
          {item.thumbnail && !imgError ? (
            <img
              src={item.thumbnail}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="thumb-fallback">
              <PlayIcon size={20} />
            </div>
          )}
        </div>
        <div className="video-meta">
          <div className="video-title" title={item.title || item.url}>
            {item.title || item.url || '분석 중…'}
          </div>
          <div className="video-source">
            <YoutubeIcon size={14} />
            <span>{item.sourceDomain || '—'}</span>
          </div>
        </div>
      </div>

      <div className="col-quality cell-center">
        {editable && !isAudio ? (
          <div className="select-wrap mini">
            <select value={item.quality} onChange={(e) => changeQuality(e.target.value)}>
              {qualities.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
            <span className="select-chevron">
              <ChevronIcon size={13} />
            </span>
          </div>
        ) : (
          <span className="cell-text">{isAudio ? '오디오' : item.quality}</span>
        )}
      </div>

      <div className="col-format cell-center">
        {editable ? (
          <div className="select-wrap mini">
            <select value={item.format} onChange={(e) => changeFormat(e.target.value)}>
              {FORMAT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f.toUpperCase()}
                </option>
              ))}
            </select>
            <span className="select-chevron">
              <ChevronIcon size={13} />
            </span>
          </div>
        ) : (
          <span className="cell-text">{item.format.toUpperCase()}</span>
        )}
      </div>

      <div className="col-duration cell-center">
        <span className="cell-icon-text">
          <ClockIcon size={14} />
          {formatDuration(item.durationSec)}
        </span>
      </div>

      <div className="col-size cell-center">
        <span className="cell-icon-text">
          <FileIcon size={14} />
          {sizeLabel(item)}
        </span>
      </div>

      <div className="col-status cell-center">
        <StatusBadge item={item} />
      </div>

      <div className="col-actions cell-actions">
        <button
          className="icon-action"
          disabled={!hasFile}
          onClick={() => hasFile && void api.openFolder(item.filePath)}
          aria-label="폴더에서 열기"
          title="폴더에서 열기"
        >
          <FolderOpenIcon size={17} />
        </button>
        <button
          className="icon-action"
          disabled={!canCancel}
          onClick={() => canCancel && void api.cancelDownload(item.id)}
          aria-label="취소"
          title="다운로드 취소"
        >
          <XIcon size={17} />
        </button>
        <button
          className="icon-action"
          onClick={() => void api.removeItem(item.id)}
          aria-label="삭제"
          title="목록에서 제거"
        >
          <TrashIcon size={16} />
        </button>
        <div className="menu-anchor" ref={menuRef}>
          <button
            ref={dotsRef}
            className="icon-action"
            onClick={toggleMenu}
            aria-label="더보기"
            title="더보기"
          >
            <DotsIcon size={16} />
          </button>
          {menuOpen && menuPos && (
            <div
              className={`row-menu${menuPos.up ? ' menu-up' : ''}`}
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              {(item.status === 'ready' || item.status === 'canceled') && (
                <button
                  onClick={() => {
                    void api.startDownload(item.id)
                    setMenuOpen(false)
                  }}
                >
                  다운로드 시작
                </button>
              )}
              {item.status === 'error' && (
                <button
                  onClick={() => {
                    void api.retryDownload(item.id)
                    setMenuOpen(false)
                  }}
                >
                  다시 시도
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => {
                    void api.cancelDownload(item.id)
                    setMenuOpen(false)
                  }}
                >
                  다운로드 취소
                </button>
              )}
              {hasFile && (
                <button
                  onClick={() => {
                    void api.openFile(item.filePath)
                    setMenuOpen(false)
                  }}
                >
                  파일 열기
                </button>
              )}
              {hasFile && (
                <button
                  onClick={() => {
                    void api.openFolder(item.filePath)
                    setMenuOpen(false)
                  }}
                >
                  폴더에서 열기
                </button>
              )}
              <button
                onClick={() => {
                  copyUrl()
                  setMenuOpen(false)
                }}
              >
                URL 복사
              </button>
              <div className="menu-sep" />
              <button
                className="menu-danger"
                onClick={() => {
                  void api.removeItem(item.id)
                  setMenuOpen(false)
                }}
              >
                목록에서 제거
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
