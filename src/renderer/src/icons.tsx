import type { ReactNode } from 'react'

export interface IconProps {
  size?: number
  className?: string
}

function Stroke({
  size = 18,
  className,
  strokeWidth = 2,
  children
}: IconProps & { strokeWidth?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function LinkIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Stroke>
  )
}

export function FolderIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </Stroke>
  )
}

export function FolderOpenIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
    </Stroke>
  )
}

export function CookieIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
      <path d="M8.5 8.5v.01" />
      <path d="M16 15.5v.01" />
      <path d="M12 12v.01" />
      <path d="M11 17v.01" />
      <path d="M7 14v.01" />
    </Stroke>
  )
}

export function HelpIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </Stroke>
  )
}

export function ChevronIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="m6 9 6 6 6-6" />
    </Stroke>
  )
}

export function XIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Stroke>
  )
}

export function CloseIcon(p: IconProps) {
  return (
    <Stroke {...p} strokeWidth={1.8}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Stroke>
  )
}

export function TrashIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Stroke>
  )
}

export function CheckIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="M20 6 9 17l-5-5" />
    </Stroke>
  )
}

export function CheckCircleIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </Stroke>
  )
}

export function AlertIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4.5" />
      <path d="M12 16h.01" />
    </Stroke>
  )
}

export function InfoIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </Stroke>
  )
}

export function ClockIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Stroke>
  )
}

export function FileIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </Stroke>
  )
}

export function InboxIcon(p: IconProps) {
  return (
    <Stroke {...p} strokeWidth={1.6}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </Stroke>
  )
}

export function MinimizeIcon(p: IconProps) {
  return (
    <Stroke {...p} strokeWidth={1.6}>
      <path d="M5 12h14" />
    </Stroke>
  )
}

export function MaximizeIcon(p: IconProps) {
  return (
    <Stroke {...p} strokeWidth={1.6}>
      <rect x="5" y="5" width="14" height="14" rx="1.5" />
    </Stroke>
  )
}

export function RestoreIcon(p: IconProps) {
  return (
    <Stroke {...p} strokeWidth={1.6}>
      <rect x="4" y="8" width="12" height="12" rx="1.5" />
      <path d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
    </Stroke>
  )
}

export function LogoIcon(p: IconProps) {
  return (
    <Stroke {...p} strokeWidth={2.4}>
      <path d="m5 7 7 6 7-6" />
      <path d="m5 13 7 6 7-6" />
    </Stroke>
  )
}

export function DotsIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
    </svg>
  )
}

export function PlayIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  )
}

export function YoutubeIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="#FF0000"
        d="M23.5 7.2a3 3 0 0 0-2.1-2.1C19.5 4.6 12 4.6 12 4.6s-7.5 0-9.4.5A3 3 0 0 0 .5 7.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-4.8z"
      />
      <path fill="#fff" d="M9.6 15.6V8.4l6.2 3.6z" />
    </svg>
  )
}
