import type { ReactNode } from 'react'
import { cn } from './cn'

export interface DataColumn<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Classes da coluna (largura, alinhamento: `text-right`, `w-40`…). */
  className?: string
}

export interface DataTableProps<T> {
  columns: readonly DataColumn<T>[]
  rows: readonly T[]
  rowKey: (row: T) => string
  /** Torna a linha clicável e alcançável por teclado. */
  onRowClick?: (row: T) => void
  /** Exibido no lugar do corpo quando `rows` está vazio. */
  empty?: ReactNode
  /** Legenda acessível da tabela. */
  caption?: string
  className?: string
}

/** Tabela dentro de um cartão: só a própria tabela rola na horizontal, nunca a página. */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, empty, caption, className }: DataTableProps<T>) {
  const showEmpty = rows.length === 0 && empty !== undefined
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-surface shadow-card', className)}>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-left text-[15px] text-text">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    'sticky top-0 z-[1] border-b border-border-strong bg-surface-muted px-4 py-3 text-sm font-semibold whitespace-nowrap text-text',
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          {showEmpty ? null : (
            <tbody>
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault()
                            onRowClick(row)
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn(
                    'border-b border-border last:border-b-0',
                    onRowClick ? 'cursor-pointer hover:bg-surface-muted' : 'hover:bg-surface-muted/60',
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-4 py-3.5 align-middle', c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      {showEmpty ? empty : null}
    </div>
  )
}
