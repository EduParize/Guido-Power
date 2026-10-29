import type { ComponentProps } from 'react'
import { cn } from './cn'

export interface CardProps extends ComponentProps<'div'> {
  /** Remove o padding interno (tabelas que encostam nas bordas). */
  flush?: boolean
}

export function Card({ flush = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface text-text shadow-card',
        flush ? 'overflow-hidden' : 'p-5 sm:p-6',
        className,
      )}
      {...rest}
    />
  )
}
