import { cn } from './cn'

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={cn('anim-spin', className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function LoadingState({ label = 'Carregando…', className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      className={cn('flex items-center justify-center gap-3 px-4 py-16 text-base font-medium text-text-muted', className)}
    >
      <Spinner size={24} className="text-primary" />
      <span>{label}</span>
    </div>
  )
}
