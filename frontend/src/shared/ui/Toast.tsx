import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'
import type { IconName } from './Icon'

type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

export interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const DURATION_MS: Record<ToastKind, number> = { success: 4000, info: 5000, error: 8000 }

const STYLES: Record<ToastKind, { box: string; icon: IconName }> = {
  success: { box: 'bg-tone-success-bg text-tone-success-fg border-tone-success-bd', icon: 'check' },
  error: { box: 'bg-tone-danger-bg text-tone-danger-fg border-tone-danger-bd', icon: 'alert' },
  info: { box: 'bg-tone-info-bg text-tone-info-fg border-tone-info-bd', icon: 'info' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++nextId.current
      setItems((prev) => [...prev.slice(-3), { id, kind, message }])
      window.setTimeout(() => dismiss(id), DURATION_MS[kind])
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-4 bottom-4 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
      >
        {items.map((t) => {
          const { box, icon } = STYLES[t.kind]
          return (
            <div
              key={t.id}
              role={t.kind === 'error' ? 'alert' : 'status'}
              className={cn(
                'anim-toast pointer-events-auto flex items-start gap-3 rounded-lg border p-4 text-base font-medium shadow-pop contrast:border-2',
                box,
              )}
            >
              <Icon name={icon} size={20} className="mt-0.5 shrink-0" />
              <p className="min-w-0 flex-1">{t.message}</p>
              <button
                type="button"
                aria-label="Fechar aviso"
                onClick={() => dismiss(t.id)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md hover:bg-black/10"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx
}
