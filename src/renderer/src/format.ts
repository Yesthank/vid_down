const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

/** Human-readable byte size. MB shows 1 decimal, GB+ shows 2, smaller units none. */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '—'
  let value = bytes
  let i = 0
  while (value >= 1024 && i < UNITS.length - 1) {
    value /= 1024
    i += 1
  }
  const digits = i >= 3 ? 2 : i === 2 ? 1 : 0
  return `${value.toFixed(digits)} ${UNITS[i]}`
}

/** Seconds to zero-padded HH:MM:SS. */
export function formatDuration(totalSec: number): string {
  const total = Math.max(0, Math.floor(totalSec || 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/** Bytes-per-second to a "12.3 MB/s" style string; empty when unknown. */
export function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return ''
  return `${formatBytes(bytesPerSec)}/s`
}

/** Remaining seconds to a Korean "1분 30초" style string; empty when unknown. */
export function formatEta(sec: number): string {
  if (!sec || sec <= 0) return ''
  const total = Math.floor(sec)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}시간 ${m}분`
  if (m > 0) return `${m}분 ${s}초`
  return `${s}초`
}
