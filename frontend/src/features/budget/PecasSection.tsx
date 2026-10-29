import { useRef } from 'react'
import { calcBudget, emptyPeca } from '../../shared/lib/budget.ts'
import type { PecaLinha } from '../../shared/lib/budget.ts'
import { formatBRL } from '../../shared/lib/money.ts'
import { Button, Combobox, IconButton } from '../../shared/ui'
import { catalogKey } from './catalog.ts'
import type { CatalogItem } from './catalog.ts'
import { DecimalInput } from './DecimalInput'
import { ColumnHeaders, LineCell, SectionHeading } from './LineCell'
import type { PecaErrors } from './validation.ts'

const GRID = 'lg:grid-cols-[minmax(0,1fr)_6rem_10rem_9rem_2.75rem]'
const getKey = (i: CatalogItem) => i.key
const getLabel = (i: CatalogItem) => i.descricao

export interface PecasSectionProps {
  pecas: PecaLinha[]
  onChange: (next: PecaLinha[]) => void
  catalog: CatalogItem[]
  errors: Record<string, PecaErrors>
  disabled?: boolean
}

export function PecasSection({ pecas, onChange, catalog, errors, disabled }: PecasSectionProps) {
  const rootRef = useRef<HTMLElement>(null)

  const update = (key: string, patch: Partial<PecaLinha>) =>
    onChange(pecas.map((p) => (p.key === key ? { ...p, ...patch } : p)))

  function add() {
    const line = emptyPeca()
    onChange([...pecas, line])
    window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>(`[data-line="${line.key}"] input`)?.focus())
  }

  function pick(line: PecaLinha, item: CatalogItem | null) {
    if (item) update(line.key, { descricao: item.descricao, valorUnitario: item.valorUnitario })
    else update(line.key, { descricao: '' })
  }

  function typed(line: PecaLinha, text: string) {
    const known = catalog.find((i) => catalogKey(i.descricao) === catalogKey(text))
    const fillValor = known && line.valorUnitario === 0
    update(line.key, { descricao: text, ...(fillValor ? { valorUnitario: known.valorUnitario } : {}) })
  }

  return (
    <section ref={rootRef} aria-label="Peças">
      <SectionHeading title="Peças" hint="Digite para buscar no catálogo ou escreva uma peça nova.">
        <Button size="sm" variant="secondary" icon="plus" onClick={add} disabled={disabled}>
          Adicionar peça
        </Button>
      </SectionHeading>
      {pecas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-strong px-4 py-5 text-base text-text-muted">
          Nenhuma peça adicionada.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <ColumnHeaders
            className={GRID}
            columns={['Descrição', 'Qtd.', 'Valor unitário', 'Subtotal', '']}
            required={['Descrição', 'Qtd.', 'Valor unitário']}
          />
          {pecas.map((line, index) => {
            const e = errors[line.key] ?? {}
            const n = index + 1
            const subtotal = calcBudget({ pecas: [line], maoDeObra: [] }).totalPecas
            const selected: CatalogItem | null = line.descricao.trim()
              ? (catalog.find((i) => catalogKey(i.descricao) === catalogKey(line.descricao)) ?? {
                  key: `livre-${line.key}`,
                  descricao: line.descricao,
                  valorUnitario: line.valorUnitario,
                  usos: 0,
                })
              : null
            return (
              <div
                key={line.key}
                data-line={line.key}
                className={`grid gap-3 rounded-lg border border-border bg-surface-muted/50 p-3 lg:items-start lg:border-0 lg:bg-transparent lg:p-0 ${GRID}`}
              >
                <LineCell label="Descrição" required>
                  <Combobox<CatalogItem>
                    items={catalog}
                    getKey={getKey}
                    getLabel={getLabel}
                    value={selected}
                    onChange={(item) => pick(line, item)}
                    allowFreeText
                    onFreeText={(text) => typed(line, text)}
                    aria-label={`Descrição da peça ${n}`}
                    placeholder="Buscar ou digitar peça"
                    error={e.descricao}
                    required
                    disabled={disabled}
                    emptyText="Nenhuma peça no catálogo"
                    renderItem={(item, { label }) => (
                      <span className="flex items-baseline justify-between gap-3">
                        <span>{label}</span>
                        <span className="text-sm tabular-nums opacity-80">{formatBRL(item.valorUnitario)}</span>
                      </span>
                    )}
                  />
                </LineCell>
                <LineCell label="Qtd." error={e.quantidade} required>
                  <DecimalInput
                    kind="int"
                    value={line.quantidade}
                    onChange={(quantidade) => update(line.key, { quantidade })}
                    aria-label={`Quantidade da peça ${n}`}
                    invalid={!!e.quantidade}
                    required
                    disabled={disabled}
                  />
                </LineCell>
                <LineCell label="Valor unitário" error={e.valorUnitario} required>
                  <DecimalInput
                    kind="money"
                    value={line.valorUnitario}
                    onChange={(valorUnitario) => update(line.key, { valorUnitario })}
                    aria-label={`Valor unitário da peça ${n}`}
                    invalid={!!e.valorUnitario}
                    required
                    disabled={disabled}
                  />
                </LineCell>
                <LineCell label="Subtotal" className="lg:flex lg:h-11 lg:items-center lg:justify-end">
                  <output aria-label={`Subtotal da peça ${n}`} className="block text-right text-lg font-bold tabular-nums">
                    {formatBRL(subtotal)}
                  </output>
                </LineCell>
                <IconButton
                  aria-label={`Remover peça ${n}`}
                  icon="trash"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => onChange(pecas.filter((p) => p.key !== line.key))}
                  className="justify-self-end text-danger"
                />
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
