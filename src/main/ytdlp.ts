import { spawn, execFile, ChildProcess } from 'child_process'
import type { ToolStatus } from '../shared/types'

const QUALITY_HEIGHTS: Record<string, number> = {
  '2160p': 2160,
  '1440p': 1440,
  '1080p': 1080,
  '720p': 720,
  '480p': 480,
  '360p': 360,
  '240p': 240,
  '144p': 144
}
const QUALITY_BUCKETS = [2160, 1440, 1080, 720, 480, 360, 240, 144]
const AUDIO_FORMATS = new Set(['mp3', 'm4a'])

export interface VideoMeta {
  id: string
  title: string
  webpageUrl: string
  thumbnail: string
  sourceDomain: string
  durationSec: number
  availableQualities: string[]
  estimatedBytes: number
}

export interface DownloadHandle {
  child: ChildProcess
  canceled: boolean
}

export interface DownloadCallbacks {
  onProgress(p: {
    progress: number
    downloadedBytes: number
    totalBytes: number
    speed: number
    eta: number
  }): void
  onPhase(label: string): void
  onDone(filePath: string): void
  onError(message: string): void
}

export interface DownloadOptions {
  url: string
  quality: string
  format: string
  outputDir: string
  cookieSource: string
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function parseError(stderr: string): string {
  if (!stderr) return ''
  const line = stderr
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith('ERROR:'))
  return line ? line.replace(/^ERROR:\s*/, '') : ''
}

export function checkTools(): Promise<ToolStatus> {
  const probe = (cmd: string, args: string[]): Promise<boolean> =>
    new Promise((resolve) => {
      execFile(cmd, args, { windowsHide: true }, (err) => resolve(!err))
    })
  return Promise.all([probe('yt-dlp', ['--version']), probe('ffmpeg', ['-version'])]).then(
    ([ytdlp, ffmpeg]) => ({ ytdlp, ffmpeg })
  )
}

function pickThumbnail(info: Record<string, unknown>): string {
  if (typeof info.thumbnail === 'string' && info.thumbnail) return info.thumbnail
  const thumbs = Array.isArray(info.thumbnails)
    ? (info.thumbnails as Array<Record<string, unknown>>)
    : []
  const sized = thumbs.filter((t) => typeof t.url === 'string' && typeof t.width === 'number')
  if (sized.length) {
    sized.sort(
      (a, b) => Math.abs(num(a.width) - 480) - Math.abs(num(b.width) - 480)
    )
    return String(sized[0].url)
  }
  const last = thumbs[thumbs.length - 1]
  return last && typeof last.url === 'string' ? last.url : ''
}

function estimateSize(formats: Array<Record<string, unknown>>, targetHeight: number): number {
  const sizeOf = (f: Record<string, unknown>): number =>
    num(f.filesize) || num(f.filesize_approx)
  const isVideo = (f: Record<string, unknown>): boolean =>
    typeof f.vcodec === 'string' && f.vcodec !== 'none' && num(f.height) > 0
  const isAudio = (f: Record<string, unknown>): boolean =>
    (!f.vcodec || f.vcodec === 'none') &&
    typeof f.acodec === 'string' &&
    f.acodec !== 'none'

  const combined = formats.filter(
    (f) =>
      isVideo(f) &&
      typeof f.acodec === 'string' &&
      f.acodec !== 'none' &&
      sizeOf(f) > 0
  )
  if (combined.length) {
    combined.sort(
      (a, b) => Math.abs(num(a.height) - targetHeight) - Math.abs(num(b.height) - targetHeight)
    )
    const c = sizeOf(combined[0])
    if (c > 0) return c
  }

  const videos = formats.filter((f) => isVideo(f) && sizeOf(f) > 0)
  let video = 0
  if (videos.length) {
    videos.sort(
      (a, b) => Math.abs(num(a.height) - targetHeight) - Math.abs(num(b.height) - targetHeight)
    )
    video = sizeOf(videos[0])
  }
  const audios = formats.filter((f) => isAudio(f) && sizeOf(f) > 0)
  const audio = audios.length ? Math.max(...audios.map(sizeOf)) : 0
  return video + audio
}

function toMeta(info: Record<string, unknown>, fallbackUrl: string): VideoMeta {
  const formats = Array.isArray(info.formats)
    ? (info.formats as Array<Record<string, unknown>>)
    : []
  const heights = new Set<number>()
  for (const f of formats) {
    if (typeof f.vcodec === 'string' && f.vcodec !== 'none' && num(f.height) > 0) {
      heights.add(num(f.height))
    }
  }
  const maxHeight = heights.size ? Math.max(...heights) : 0
  let qualities = QUALITY_BUCKETS.filter((b) => b <= maxHeight).map((b) => `${b}p`)
  if (!qualities.length) qualities = ['best']

  const target = Math.min(maxHeight || 1080, 1080)
  const webpageUrl =
    (typeof info.webpage_url === 'string' && info.webpage_url) ||
    (typeof info.original_url === 'string' && info.original_url) ||
    (typeof info.url === 'string' && info.url) ||
    fallbackUrl
  const domain =
    (typeof info.webpage_url_domain === 'string' && info.webpage_url_domain) ||
    extractDomain(webpageUrl)

  return {
    id: String(info.id ?? Math.random().toString(36).slice(2)),
    title: String(info.title ?? info.fulltitle ?? '제목 없음'),
    webpageUrl,
    thumbnail: pickThumbnail(info),
    sourceDomain: domain,
    durationSec: num(info.duration),
    availableQualities: qualities,
    estimatedBytes: estimateSize(formats, target)
  }
}

export function analyze(url: string): Promise<VideoMeta[]> {
  return new Promise((resolve, reject) => {
    execFile(
      'yt-dlp',
      ['--dump-single-json', '--no-warnings', '--ignore-errors', '--no-playlist', url],
      { windowsHide: true, maxBuffer: 1024 * 1024 * 128 },
      (err, stdout, stderr) => {
        const text = (stdout || '').trim()
        if (!text) {
          reject(new Error(parseError(stderr) || err?.message || '영상 정보를 가져오지 못했습니다'))
          return
        }
        try {
          const data = JSON.parse(text) as Record<string, unknown>
          if (data._type === 'playlist' && Array.isArray(data.entries)) {
            const metas = (data.entries as Array<Record<string, unknown> | null>)
              .filter((e): e is Record<string, unknown> => !!e)
              .map((e) => toMeta(e, url))
            if (!metas.length) {
              reject(new Error('재생목록에서 영상을 찾지 못했습니다'))
              return
            }
            resolve(metas)
          } else {
            resolve([toMeta(data, url)])
          }
        } catch {
          reject(new Error('영상 정보를 해석하지 못했습니다'))
        }
      }
    )
  })
}

function buildArgs(opts: DownloadOptions): string[] {
  const outDir = opts.outputDir.replace(/[\\/]+$/, '')
  const output = `${outDir}/%(title).180B [%(id)s].%(ext)s`
  const args: string[] = [
    '--newline',
    // Forces progress output even when stdout/stderr is a pipe (non-TTY).
    // Without it yt-dlp suppresses progress and the UI stays stuck at 0%.
    '--progress',
    '--no-color',
    '--no-warnings',
    '--no-playlist',
    '--no-mtime',
    '--progress-template',
    'download:[CFP]%(progress.status)s\t%(progress.downloaded_bytes)s\t' +
      '%(progress.total_bytes)s\t%(progress.total_bytes_estimate)s\t' +
      '%(progress.speed)s\t%(progress.eta)s',
    '--print',
    'after_move:[CFF]%(filepath)s',
    '-o',
    output
  ]

  if (opts.cookieSource && opts.cookieSource !== 'none') {
    args.push('--cookies-from-browser', opts.cookieSource)
  }

  if (AUDIO_FORMATS.has(opts.format)) {
    args.push('-f', 'bestaudio/best', '-x', '--audio-format', opts.format)
  } else {
    const height = QUALITY_HEIGHTS[opts.quality]
    let selector: string
    if (opts.format === 'mp4') {
      selector = height
        ? `bv*[height<=${height}][ext=mp4]+ba[ext=m4a]/bv*[height<=${height}]+ba/b[height<=${height}]/b`
        : 'bv*[ext=mp4]+ba[ext=m4a]/bv*+ba/b'
    } else if (opts.format === 'webm') {
      selector = height
        ? `bv*[height<=${height}][ext=webm]+ba[ext=webm]/bv*[height<=${height}]+ba/b[height<=${height}]/b`
        : 'bv*[ext=webm]+ba[ext=webm]/bv*+ba/b'
    } else {
      selector = height ? `bv*[height<=${height}]+ba/b[height<=${height}]/b` : 'bv*+ba/b'
    }
    args.push('-f', selector, '--merge-output-format', opts.format)
  }

  args.push(opts.url)
  return args
}

function streamLines(
  stream: NodeJS.ReadableStream | null,
  onLine: (line: string) => void
): void {
  if (!stream) return
  let buffer = ''
  stream.setEncoding('utf-8')
  stream.on('data', (chunk: string) => {
    buffer += chunk
    let idx = buffer.search(/[\r\n]/)
    while (idx >= 0) {
      const line = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 1)
      if (line) onLine(line)
      idx = buffer.search(/[\r\n]/)
    }
  })
  stream.on('end', () => {
    if (buffer.trim()) onLine(buffer)
  })
}

export function download(opts: DownloadOptions, cb: DownloadCallbacks): DownloadHandle {
  const child = spawn('yt-dlp', buildArgs(opts), { windowsHide: true })
  const handle: DownloadHandle = { child, canceled: false }
  let finalPath = ''
  let lastError = ''

  const handleLine = (raw: string): void => {
    const line = raw.trim()
    if (!line) return
    if (line.startsWith('[CFP]')) {
      const [, downloaded, total, totalEst, speed, eta] = line.slice(5).split('\t')
      const downloadedBytes = num(downloaded)
      const totalBytes = num(total) || num(totalEst)
      const progress = totalBytes > 0 ? Math.min(100, (downloadedBytes / totalBytes) * 100) : 0
      cb.onProgress({ progress, downloadedBytes, totalBytes, speed: num(speed), eta: num(eta) })
    } else if (line.startsWith('[CFF]')) {
      finalPath = line.slice(5).trim()
    } else if (line.startsWith('ERROR:')) {
      lastError = line.replace(/^ERROR:\s*/, '')
    } else if (line.includes('[Merger]')) {
      cb.onPhase('병합 중')
    } else if (line.includes('[ExtractAudio]')) {
      cb.onPhase('오디오 추출 중')
    }
  }

  streamLines(child.stdout, handleLine)
  streamLines(child.stderr, handleLine)

  child.on('error', (e) => {
    if (handle.canceled) return
    cb.onError(e.message || 'yt-dlp 실행에 실패했습니다')
  })
  child.on('close', (code) => {
    if (handle.canceled) return
    if (code === 0) cb.onDone(finalPath)
    else cb.onError(lastError || `다운로드에 실패했습니다 (코드 ${code ?? -1})`)
  })

  return handle
}

export function killTree(pid: number): void {
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true })
    } else {
      process.kill(pid, 'SIGKILL')
    }
  } catch {
    /* process may already be gone */
  }
}
