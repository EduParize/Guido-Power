import type { ReactNode } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'
import type { IconName } from './Icon'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const TONES: Record<AlertTone, { box: string; icon: IconName }> = {
  info: { box: 'bg-tone-info-bg text-tone-info-fg border-tone-info-bd', icon: 'info' },
  success: { box: 'bg-tone-success-bg text-tone-success-fg border-tone-success-bd', icon: 'check' },
  warning: { box: 'bg-tone-warning-bg text-tone-warning-fg border-tone-warning-bd', icon: 'alert' },
  danger: { box: 'bg-tone-danger-bg text-tone-danger-fg border-tone-danger-bd', icon: 'alert' },
}

export interface AlertProps {
  tone?: AlertTone
  title?: string
  children?: ReactNode
  /** Ação à direita (ex.: botão "Tentar novamente"). */
  action?: ReactNode
  className?: string
}

export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const { box, icon } = TONES[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border p-4 text-base contrast:border-2', box, className)}
    >
      <Icon name={icon} size={22} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && 'mt-0.5')}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
