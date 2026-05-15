import { useStore } from '../store'
import type { DownloadItem, ItemStatus, SortKey, SortDir } from '../../../shared/types'
import DownloadRow from './DownloadRow'
import { ChevronIcon, InboxIcon } from '../icons'

const STATUS_RANK: Record<ItemStatus, number> = {
  downloading: 0,
  analyzing: 1,
  queued: 2,
  ready: 3,
  canceled: 4,
  error: 5,
  completed: 6
}

const STARTABLE: ItemStatus[] = ['ready', 'error', 'canceled']

function sizeOf(item: DownloadItem): number {
  if (item.status === 'completed' && item.totalBytes > 0) return item.totalBytes
  return item.estimatedBytes || item.totalBytes
}

function compare(a: DownloadItem, b: DownloadItem, key: SortKey): number {
  switch (key) {
    case 'title':
      return a.title.localeCompare(b.title, 'ko')
    case 'size':
      return sizeOf(a) - sizeOf(b)
    case 'duration':
      return a.durationSec - b.durationSec
    case 'status':
      return STATUS_RANK[a.status] - STATUS_RANK[b.status]
    default:
      return a.addedAt - b.addedAt
  }
}

export default function DownloadList() {
  const items = useStore((s) => s.items)
  const settings = useStore((s) => s.settings)
  const api = window.clipflow

  const sorted = items.slice().sort((a, b) => {
    const primary = compare(a, b, settings.sortKey)
    const ordered = primary !== 0 ? primary : a.addedAt - b.addedAt
    return settings.sortDir === 'asc' ? ordered : -ordered
  })

  const hasCompleted = items.some((i) => i.status === 'completed')
  const hasStartable = items.some((i) => STARTABLE.includes(i.status))

  return (
    <div className="card list-card">
      <div className="list-head">
        <h2 className="list-title">다운로드 목록</h2>
        <div className="list-tools">
          {hasCompleted && (
            <button className="btn-ghost" onClick={() => void api.clearCompleted()}>
              완료 항목 정리
            </button>
          )}
          {hasStartable && (
            <button className="btn-soft" onClick={() => void api.startAll()}>
              모두 다운로드
            </button>
          )}
          <span className="sort-label">정렬:</span>
          <div className="select-wrap">
            <select
              value={settings.sortKey}
              onChange={(e) => void api.updateSettings({ sortKey: e.target.value as SortKey })}
              aria-label="정렬 기준"
            >
              <option value="added">최신순</option>
              <option value="title">제목순</option>
              <option value="size">크기순</option>
              <option value="duration">길이순</option>
              <option value="status">상태순</option>
            </select>
            <span className="select-chevron">
              <ChevronIcon size={15} />
            </span>
          </div>
          <div className="select-wrap">
            <select
              value={settings.sortDir}
              onChange={(e) => void api.updateSettings({ sortDir: e.target.value as SortDir })}
              aria-label="정렬 방향"
            >
              <option value="desc">내림차순</option>
              <option value="asc">오름차순</option>
            </select>
            <span className="select-chevron">
              <ChevronIcon size={15} />
            </span>
          </div>
        </div>
      </div>

      <div className="table-head">
        <div className="col-video">영상</div>
        <div className="col-quality">품질</div>
        <div className="col-format">포맷</div>
        <div className="col-duration">길이</div>
        <div className="col-size">크기</div>
        <div className="col-status">상태</div>
        <div className="col-actions">작업</div>
      </div>

      <div className="row-scroll">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <InboxIcon size={44} />
            <p className="empty-title">아직 추가된 영상이 없습니다</p>
            <p className="empty-sub">위에 URL을 입력하고 분석을 눌러 영상을 추가하세요.</p>
          </div>
        ) : (
          sorted.map((item) => <DownloadRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}
