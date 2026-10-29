import { useRef } from 'react'
import { emptyMaoDeObra, laborValue } from '../../shared/lib/budget.ts'
import type { MaoDeObraLinha } from '../../shared/lib/budget.ts'
import { formatBRL } from '../../shared/lib/money.ts'
import { Button, IconButton, Input } from '../../shared/ui'
import { DecimalInput } from './DecimalInput'
import { ColumnHeaders, LineCell, SectionHeading } from './LineCell'
import type { MaoDeObraErrors } from './validation.ts'

const GRID = 'lg:grid-cols-[minmax(0,1fr)_7rem_10rem_9rem_2.75rem]'

export interface MaoDeObraSectionProps {
  linhas: MaoDeObraLinha[]
  onChange: (next: MaoDeObraLinha[]) => void
  precoHora: number
  errors: Record<string, MaoDeObraErrors>
  disabled?: boolean
}

export function MaoDeObraSection({ linhas, onChange, precoHora, errors, disabled }: MaoDeObraSectionProps) {
  const rootRef = useRef<HTMLElement>(null)

  const update = (key: string, patch: Partial<MaoDeObraLinha>) =>
    onChange(linhas.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  function add() {
    const line = { ...emptyMaoDeObra(precoHora), horas: 0 }
    onChange([...linhas, line])
    window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>(`[data-line="${line.key}"] input`)?.focus())
  }

  function toggleMode(l: MaoDeObraLinha) {
    if (l.horas !== null && l.precoHora !== null) update(l.key, { horas: null, valorFixo: laborValue(l) })
    else update(l.key, { horas: 0, precoHora: l.precoHora ?? precoHora, valorFixo: null })
  }

  return (
    <section ref={rootRef} aria-label="Mão de obra">
      <SectionHeading title="Mão de obra" hint="Horas × preço da hora, ou um valor fixo por serviço.">
        <Button size="sm" variant="secondary" icon="plus" onClick={add} disabled={disabled}>
          Adicionar mão de obra
        </Button>
      </SectionHeading>
      {linhas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-strong px-4 py-5 text-base text-text-muted">
          Nenhuma mão de obra adicionada.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <ColumnHeaders
            className={GRID}
            columns={['Serviço', 'Horas', 'Preço da hora', 'Valor', '']}
            required={['Serviço', 'Horas']}
          />
          {linhas.map((line, index) => {
            const e = errors[line.key] ?? {}
            const n = index + 1
            const byHour = line.horas !== null && line.precoHora !== null
            return (
              <div
                key={line.key}
                data-line={line.key}
                className="rounded-lg border border-border bg-surface-muted/50 p-3 lg:border-0 lg:bg-transparent lg:p-0"
              >
                <div className={`grid gap-3 lg:items-start ${GRID}`}>
                  <LineCell label="Serviço" error={e.descricao} required>
                    <Input
                      value={line.descricao}
                      onChange={(ev) => update(line.key, { descricao: ev.target.value })}
                      aria-label={`Descrição da mão de obra ${n}`}
                      aria-invalid={e.descricao ? true : undefined}
                      aria-required
                      placeholder="Ex.: Troca de embreagem"
                      autoComplete="off"
                      disabled={disabled}
                    />
                  </LineCell>
                  {byHour ? (
                    <>
                      <LineCell label="Horas" error={e.horas} required>
                        <DecimalInput
                          kind="hours"
                          value={line.horas ?? 0}
                          onChange={(horas) => update(line.key, { horas })}
                          aria-label={`Horas da mão de obra ${n}`}
                          invalid={!!e.horas}
                          required
                          disabled={disabled}
                        />
                      </LineCell>
                      <LineCell label="Preço da hora" error={e.precoHora}>
                        <DecimalInput
                          kind="money"
                          value={line.precoHora ?? precoHora}
                          onChange={(p) => update(line.key, { precoHora: p })}
                          aria-label={`Preço da hora da mão de obra ${n}`}
                          invalid={!!e.precoHora}
                          disabled={disabled}
                        />
                      </LineCell>
                    </>
                  ) : (
                    <LineCell label="Valor fixo" error={e.valorFixo} required className="lg:col-span-2">
                      <DecimalInput
                        kind="money"
                        value={line.valorFixo ?? 0}
                        onChange={(valorFixo) => update(line.key, { valorFixo })}
                        aria-label={`Valor fixo da mão de obra ${n}`}
                        invalid={!!e.valorFixo}
                        required
                        disabled={disabled}
                      />
                    </LineCell>
                  )}
                  <LineCell label="Valor" className="lg:flex lg:h-11 lg:items-center lg:justify-end">
                    <output aria-label={`Valor da mão de obra ${n}`} className="block text-right text-lg font-bold tabular-nums">
                      {formatBRL(laborValue(line))}
                    </output>
                  </LineCell>
                  <IconButton
                    aria-label={`Remover mão de obra ${n}`}
                    icon="trash"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => onChange(linhas.filter((l) => l.key !== line.key))}
                    className="justify-self-end text-danger"
                  />
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleMode(line)}
                  className="mt-2 text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary-hover disabled:opacity-55"
                >
                  {byHour ? 'Usar valor fixo' : 'Calcular por hora'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
