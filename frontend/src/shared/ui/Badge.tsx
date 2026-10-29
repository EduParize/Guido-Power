import type { ReactNode } from 'react'
import { cn } from './cn'

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'violet' | 'teal' | 'orange'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-tone-neutral-bg text-tone-neutral-fg border-tone-neutral-bd',
  info: 'bg-tone-info-bg text-tone-info-fg border-tone-info-bd',
  success: 'bg-tone-success-bg text-tone-success-fg border-tone-success-bd',
  warning: 'bg-tone-warning-bg text-tone-warning-fg border-tone-warning-bd',
  danger: 'bg-tone-danger-bg text-tone-danger-fg border-tone-danger-bd',
  violet: 'bg-tone-violet-bg text-tone-violet-fg border-tone-violet-bd',
  teal: 'bg-tone-teal-bg text-tone-teal-fg border-tone-teal-bd',
  orange: 'bg-tone-orange-bg text-tone-orange-fg border-tone-orange-bd',
}

export interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap contrast:border-2',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
