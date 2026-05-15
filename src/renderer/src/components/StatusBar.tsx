import { useStore } from '../store'
import { CheckCircleIcon } from '../icons'

export default function StatusBar() {
  const items = useStore((s) => s.items)
  const settings = useStore((s) => s.settings)

  const downloading = items.filter((i) => i.status === 'downloading').length
  const analyzing = items.filter((i) => i.status === 'analyzing').length
  const queued = items.filter((i) => i.status === 'queued').length

  let stateText = '준비됨'
  if (downloading > 0) stateText = `다운로드 중 ${downloading}개`
  else if (analyzing > 0) stateText = '분석 중'
  else if (queued > 0) stateText = `대기 중 ${queued}개`

  return (
    <div className="statusbar">
      <div className="status-state">
        <CheckCircleIcon size={15} />
        <span>{stateText}</span>
      </div>
      <div className="status-count">총 항목: {items.length}</div>
      <div className="status-concurrency">
        동시 다운로드: {downloading}/{settings.concurrency}
      </div>
    </div>
  )
}
