# ClipFlow — 진행 상황 기록

> 마지막 업데이트: 2026-05-15 / 작성: Claude Code 세션 인수인계용

웹 영상 다운로더 데스크톱 앱. 친구의 `vid_down.png` 목업(앱 이름 "ClipFlow")을 참고해 전체 기능을 구현하는 프로젝트.

## ✅ v1 완성 — 백엔드 + 렌더러 UI 전부 구현, 검증 통과

`npm run typecheck`(node+web) · `npm run build` 통과, `npm run dev` 로 창 정상 표시 확인됨.
아래 "남은 작업" 섹션은 모두 완료되어 기록 보존용으로만 남깁니다.

## 기술 스택 (확정)

- **Electron + React + TypeScript**, 빌드 도구는 `electron-vite`
- 백엔드 다운로드 엔진: 시스템 PATH의 `yt-dlp` + `ffmpeg` 를 자식 프로세스로 호출
- 상태 관리: `zustand` (렌더러)
- 스타일: 순수 CSS (Tailwind 미사용 — 빌드 의존성 최소화)
- Tauri 대신 Electron 선택 이유: 이 PC에 Rust/MSVC C++ 빌드 도구 미설치, 추가 설치 없이 진행하려고. UI/기능 코드는 동일.

## 현재 상태

### 완료 (백엔드 100%) — `npm run typecheck:node` 통과 확인됨

| 파일 | 내용 |
|---|---|
| `package.json`, `electron.vite.config.ts`, `tsconfig*.json`, `.gitignore` | 프로젝트 설정 |
| `src/renderer/index.html` | 렌더러 HTML 진입점 |
| `src/shared/types.ts` | 공유 타입 (`DownloadItem`, `Settings`, `ClipFlowApi` 등) — **렌더러 작성 시 기준** |
| `src/preload/index.ts` + `index.d.ts` | contextBridge로 `window.clipflow` API 노출 |
| `src/main/settings.ts` | 설정 영속화 (userData/settings.json) |
| `src/main/store.ts` | 다운로드 목록 영속화 (userData/items.json), 디바운스 저장 |
| `src/main/ytdlp.ts` | yt-dlp 래퍼: `analyze()`, `download()`, `checkTools()`, `killTree()` |
| `src/main/downloadManager.ts` | 큐 + 동시 다운로드 제한, 진행률/상태 관리 |
| `src/main/ipc.ts` | IPC 핸들러 등록 |
| `src/main/index.ts` | 앱 진입점, BrowserWindow(frameless) 생성, CSP |

`npm install` 완료됨 (node_modules 존재).

### 완료 (렌더러 UI 100%) — `npm run typecheck` + `npm run build` 통과 확인됨

아래 파일 모두 `src/renderer/src/` 에 작성 완료:

| 파일 | 역할 |
|---|---|
| `main.tsx` | React 루트 (`createRoot`, `index.css` import) |
| `App.tsx` | 레이아웃 조립 + IPC 이벤트 구독 (마운트 시 `getState()`, `onItemUpsert/onItemRemoved/onSettings/onToast/onMaximizeChange` 구독) |
| `index.css` | 전체 스타일 (아래 디자인 토큰 참고) |
| `store.ts` | zustand 스토어: `items`, `settings`, `toolStatus`, `isMaximized`, `toasts`, `helpOpen` + 액션 |
| `format.ts` | `formatBytes`, `formatDuration`(초→HH:MM:SS), `formatSpeed`, `formatEta` |
| `icons.tsx` | 인라인 SVG 아이콘 (link, folder, cookie, help, clock, file, youtube, chevron, dots, x, trash, check, alert, min/max/close, play) |
| `components/TitleBar.tsx` | 로고 + "ClipFlow" + 창 컨트롤(최소/최대/닫기). 드래그 영역 `-webkit-app-region: drag` |
| `components/TopPanel.tsx` | URL 입력 + 분석 버튼 / 폴더 선택 + 쿠키 드롭다운 + 도움말(?) 버튼 |
| `components/DownloadList.tsx` | "다운로드 목록" 헤더 + 정렬 컨트롤 + 테이블 헤더 + 행 목록 + 빈 상태 |
| `components/DownloadRow.tsx` | 한 행 (썸네일/제목/출처, 품질·포맷 셀, 길이, 크기, 상태, 작업 아이콘) |
| `components/StatusBadge.tsx` | 상태 셀 렌더링 (ready/analyzing/downloading/completed/error/queued 별 표현) |
| `components/StatusBar.tsx` | 하단 바: "준비됨" / "총 항목: N" / "동시 다운로드: active/concurrency" |
| `components/HelpModal.tsx` | 도움말 모달 |
| `components/Toasts.tsx` | 토스트 알림 (4초 자동 소멸) |

검증 완료: `npm run typecheck` ✅ → `npm run build` ✅ → `npm run dev` 로 창 정상 표시 ✅
(남은 검증: 실제 URL로 분석/다운로드 E2E 테스트는 사용자 환경에서 진행 권장.)

## IPC 계약 (preload가 노출하는 `window.clipflow`)

`src/shared/types.ts`의 `ClipFlowApi` 참고. 핵심:
- 호출: `analyze(url)`, `startDownload(id)`, `startAll()`, `cancelDownload(id)`, `retryDownload(id)`, `removeItem(id)`, `clearCompleted()`, `setItemOptions(id,{quality,format})`, `pickFolder()`, `openFolder(path)`, `openFile(path)`, `copyText(text)`, `getState()`, `updateSettings(partial)`
- 창 컨트롤: `windowMinimize()`, `windowMaximizeToggle()`, `windowClose()`
- 이벤트 구독(해제 함수 반환): `onItemUpsert`, `onItemRemoved`, `onItemsReplace`, `onSettings`, `onToast`, `onMaximizeChange`

데이터 흐름: 메인 프로세스가 다운로드 목록의 단일 진실 소스. 렌더러는 사용자 액션을 IPC로 보내고 `item-upsert`/`item-removed` 이벤트로 화면 갱신. 정렬은 렌더러가 `settings.sortKey/sortDir`로 표시만 처리.

## 디자인 토큰 (목업 vid_down.png 기준)

```
--bg-titlebar: #eef2f7   --bg-app: #ffffff      --bg-subtle: #f8fafc
--bg-hover:    #f1f5f9   --border:  #e7ebf0     --border-strong: #d8dee6
--text:    #1e293b      --text-muted: #64748b  --text-faint: #94a3b8
--primary: #2563eb      --primary-hover: #1d4ed8
--green: #16a34a / 배경 #dcfce7    --red: #dc2626 / 배경 #fee2e2
radius: 카드 12px, 입력/버튼 9-10px, 작은 요소 6px
폰트: "Segoe UI", "Malgun Gothic", system-ui
창: frameless(940x1000, 최소 820x600), 커스텀 타이틀바
```

목업 레이아웃: 타이틀바 → 상단 패널(URL 행 + 폴더/쿠키 행) → "다운로드 목록" 카드(헤더+정렬, 테이블) → 하단 상태바.
테이블 열: 영상 / 품질 / 포맷 / 길이 / 크기 / 상태 / 작업.

## 구현 시 주의점 / 결정사항

- **품질·포맷 셀**: 상태가 `ready`/`analyzing`/`error`일 때만 드롭다운(native `<select>` 권장 — 안정성). `downloading`/`completed`/`queued`는 평문 텍스트로 표시 (목업의 완료 행이 그렇게 되어 있음).
- **다운로드 시작 UX**: 목업 작업열 아이콘은 [폴더열기][취소X][삭제][⋮] 4개뿐. 시작 버튼이 없음 → `준비` 상태 배지를 클릭 가능하게 만들어 시작 트리거로 사용 + 별도 "모두 다운로드" 버튼 추가 권장. ⋮ 메뉴에도 컨텍스트 액션.
- **분석 진행률**: 단일 영상 분석은 빠름. 목업의 "분석 중 32%"는 렌더러에서 0→90% 부드럽게 애니메이션하다 완료 시 채우는 방식(NProgress 패턴)으로 처리 권장.
- **다운로드 진행률**: yt-dlp가 영상→오디오 2단계라 % 가 한 번 리셋될 수 있음. v1은 yt-dlp 보고값 그대로 표시(허용 범위).
- **`--progress` 필수 (중요)**: Electron이 spawn한 자식 프로세스의 출력은 non-TTY 파이프라서 yt-dlp가 진행률 출력을 자동 억제함. `ytdlp.ts buildArgs`에 `--progress`가 있어야 `--progress-template`(`[CFP]` 라인)이 나옴. 빠지면 다운로드는 되지만 UI가 0%에 멈춤. (2026-05-15 수정 완료.)
- **YouTube JS 런타임 경고(환경 이슈)**: yt-dlp가 `WARNING: [youtube] No supported JavaScript runtime` 경고를 낼 수 있음. `deno` 등 JS 런타임 미설치 시 일부 고화질 포맷이 누락될 수 있음 — 앱 버그 아님. 필요 시 deno 설치 권장(yt-dlp EJS 위키 참고).
- **취소**: 다운로드 중 취소 시 상태는 `ready`로 복귀(목업에 별도 취소 상태 없음). Windows에서 `taskkill /T`로 ffmpeg 자식까지 종료 — 이미 `killTree()` 구현됨.
- **CSP**: 프로덕션만 메인에서 헤더로 설정. 개발 모드는 HMR 위해 미적용. 썸네일은 원격 https 이미지 직접 로드 허용.
- 재시작 시 진행 중이던 다운로드는 `ready`로, 분석 미완료는 `error`로 리셋 (store.ts에 구현됨).
- yt-dlp/ffmpeg는 PATH 의존. `checkTools()` 결과를 `toolStatus`로 받아 없으면 렌더러 상단에 경고 배너 노출 권장. (이 PC는 둘 다 설치 확인됨: yt-dlp 2026.03.17, ffmpeg 8.1)

## 실행 방법

```
cd vid_down
npm run dev        # 개발 모드 (창 표시 + DevTools)
npm run typecheck  # 타입 검사
npm run build      # 프로덕션 번들 (out/)
npm run dist       # Windows 인스톨러 빌드 (release/)
```
