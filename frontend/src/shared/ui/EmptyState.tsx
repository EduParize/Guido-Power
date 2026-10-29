import type { ReactNode } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'
import type { IconName } from './Icon'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: IconName
  /** Botão/link da próxima ação. */
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon = 'inbox', action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-4 py-14 text-center', className)}>
      <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-text-muted">
        <Icon name={icon} size={28} />
      </span>
      <h2 className="text-xl font-semibold text-text">{title}</h2>
      {description ? <p className="max-w-md text-base text-text-muted">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
