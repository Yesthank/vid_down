import { useEffect } from 'react'
import { useStore } from '../store'
import { CloseIcon } from '../icons'

const SECTIONS = [
  {
    title: '1. 영상 추가',
    body: '상단 입력란에 영상 페이지 URL을 붙여넣고 분석을 누르세요. 재생목록 URL을 넣으면 포함된 영상이 모두 목록에 추가됩니다.'
  },
  {
    title: '2. 품질 · 포맷 선택',
    body: '준비 상태의 항목은 품질·포맷 칸의 드롭다운으로 바꿀 수 있습니다. 포맷을 MP3 또는 M4A로 고르면 오디오만 추출합니다.'
  },
  {
    title: '3. 다운로드 시작',
    body: '"준비" 배지를 클릭하면 그 영상을, "모두 다운로드"를 누르면 대기 중인 모든 영상을 받습니다. 진행 중에는 작업 칸의 X로 취소할 수 있습니다.'
  },
  {
    title: '4. 로그인이 필요한 영상',
    body: '쿠키 메뉴에서 브라우저를 선택하면 그 브라우저의 로그인 쿠키를 사용합니다. 쿠키를 읽는 동안에는 해당 브라우저를 완전히 종료해 두세요.'
  },
  {
    title: '5. 완료된 파일',
    body: '다운로드가 끝나면 작업 칸의 폴더 아이콘으로 저장 위치를 열 수 있습니다. "완료 항목 정리"로 완료된 항목을 목록에서 비웁니다.'
  }
]

export default function HelpModal() {
  const open = useStore((s) => s.helpOpen)
  const setHelpOpen = useStore((s) => s.setHelpOpen)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setHelpOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setHelpOpen])

  if (!open) return null

  return (
    <div className="modal-overlay" onMouseDown={() => setHelpOpen(false)}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>ClipFlow 도움말</h3>
          <button className="icon-btn" onClick={() => setHelpOpen(false)} aria-label="닫기">
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="modal-body">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
            </section>
          ))}
        </div>
        <div className="modal-foot">
          <span className="modal-note">yt-dlp · ffmpeg 기반</span>
          <button className="btn-primary" onClick={() => setHelpOpen(false)}>
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
