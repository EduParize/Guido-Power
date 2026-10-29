import type { ReactNode } from 'react'
import { cn } from '../../shared/ui'

/** Mesmo marcador de obrigatório do Field. */
function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-1 font-bold text-danger" title="Obrigatório">
      *
    </span>
  )
}

/** Célula de linha: rótulo visível só no mobile (no desktop o cabeçalho da seção rotula a coluna). */
export function LineCell({
  label,
  error,
  required,
  className,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <span aria-hidden="true" className="mb-1 block text-sm font-semibold text-text lg:hidden">
        {label}
        {required ? <RequiredMark /> : null}
      </span>
      {children}
      {error ? <p className="mt-1 text-sm font-semibold text-danger">{error}</p> : null}
    </div>
  )
}

export function ColumnHeaders({
  columns,
  required = [],
  className,
}: {
  columns: readonly string[]
  required?: readonly string[]
  className: string
}) {
  return (
    <div aria-hidden="true" className={cn('hidden gap-3 px-1 text-sm font-semibold text-text-muted lg:grid', className)}>
      {columns.map((c, i) => (
        <span key={`${c}-${i}`} className={i > 0 && c !== '' ? 'text-right' : undefined}>
          {c}
          {required.includes(c) ? <RequiredMark /> : null}
        </span>
      ))}
    </div>
  )
}

export function SectionHeading({ title, hint, children }: { title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        {hint ? <p className="text-sm text-text-muted">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}
