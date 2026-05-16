# ClipFlow

웹 영상 다운로더 데스크톱 앱. URL을 붙여넣으면 `yt-dlp`로 영상을 분석·다운로드하고,
`ffmpeg`로 영상과 오디오를 병합합니다. Electron + React + TypeScript로 만들었습니다.

## 사전 준비

이 앱은 시스템에 설치된 `yt-dlp`와 `ffmpeg`를 사용합니다. 둘 다 PATH에 있어야 합니다.

```powershell
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```

설치 후 터미널을 새로 열어 확인:

```powershell
yt-dlp --version
ffmpeg -version
```

> 도구가 없으면 앱은 켜지지만 상단에 경고 배너가 뜨고 다운로드가 되지 않습니다.

## 설치 & 실행

```bash
npm install      # 의존성 설치 (최초 1회)
npm run dev      # 개발 모드 — 창 표시 + DevTools
```

## 사용법

1. **영상 추가** — 상단 입력란에 영상 페이지 URL을 붙여넣고 **분석**(또는 Enter)을 누릅니다.
   재생목록 URL을 넣으면 포함된 영상이 모두 목록에 추가됩니다.
2. **품질·포맷 선택** — 목록의 *준비* 상태 항목은 품질·포맷 드롭다운으로 바꿀 수 있습니다.
   포맷을 `MP3`·`M4A`로 고르면 오디오만 추출합니다.
3. **다운로드 시작** — 상태 칸의 **준비** 배지를 클릭하면 그 영상을, **모두 다운로드** 버튼을
   누르면 대기 중인 모든 영상을 받습니다. 진행률 바와 속도가 실시간으로 표시됩니다.
4. **작업 칸 아이콘** — 폴더 열기 · 취소(✕) · 목록에서 제거(🗑) · 더보기(⋮).
5. **저장 폴더 / 쿠키** — 폴더 칸을 눌러 저장 위치를 바꾸고, 로그인이 필요한 영상은
   쿠키 메뉴에서 브라우저를 선택합니다 (쿠키를 읽는 동안 그 브라우저는 종료해 두세요).

화면 오른쪽 위 **?** 버튼에서 앱 안의 도움말도 볼 수 있습니다.

## 빌드

```bash
npm run typecheck   # 타입 검사
npm run build       # 프로덕션 번들 (out/)
npm run dist        # Windows 인스톨러 빌드 (release/)
```

## 기술 스택

- **Electron + React + TypeScript**, 빌드 도구 `electron-vite`
- 상태 관리 `zustand`, 스타일 순수 CSS
- 다운로드 엔진: 시스템의 `yt-dlp` + `ffmpeg`를 자식 프로세스로 호출

## 라이선스

개인 프로젝트입니다. `yt-dlp`와 `ffmpeg`는 각자의 라이선스를 따릅니다.
