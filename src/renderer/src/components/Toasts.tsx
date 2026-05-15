import { useEffect } from 'react'
import { useStore } from '../store'
import type { Toast } from '../store'
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from '../icons'

function ToastView({ toast }: { toast: Toast }) {
  const dismiss = useStore((s) => s.dismissToast)

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, dismiss])

  const icon =
    toast.kind === 'success' ? (
      <CheckIcon size={16} />
    ) : toast.kind === 'error' ? (
      <AlertIcon size={16} />
    ) : (
      <InfoIcon size={16} />
    )

  return (
    <div className={`toast toast-${toast.kind}`}>
      <span className="toast-icon">{icon}</span>
      <span className="toast-msg">{toast.message}</span>
      <button className="toast-close" onClick={() => dismiss(toast.id)} aria-label="닫기">
        <CloseIcon size={14} />
      </button>
    </div>
  )
}

export default function Toasts() {
  const toasts = useStore((s) => s.toasts)

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <ToastView key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
