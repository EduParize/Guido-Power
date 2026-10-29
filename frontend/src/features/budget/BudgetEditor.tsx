import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { calcBudget } from '../../shared/lib/budget.ts'
import type { BudgetState } from '../../shared/lib/budget.ts'
import { usePrecoHora } from '../../shared/settings/precoHora.ts'
import { Card } from '../../shared/ui'
import { BudgetSummary } from './BudgetSummary'
import { MaoDeObraSection } from './MaoDeObraSection'
import { PecasSection } from './PecasSection'
import type { CatalogItem } from './catalog.ts'
import { NO_BUDGET_ERRORS } from './validation.ts'
import type { BudgetErrors } from './validation.ts'

export interface BudgetEditorProps {
  value: BudgetState
  onChange: (next: BudgetState) => void
  catalog: CatalogItem[]
  /** Preço da hora usado em novas linhas de mão de obra. Padrão: o configurado em Configurações. */
  precoHora?: number
  errors?: BudgetErrors
  disabled?: boolean
  /** Conteúdo abaixo do total no painel fixo (ex.: botões Salvar/Cancelar). */
  summaryFooter?: ReactNode
  /** Aviso exibido acima das peças. */
  notice?: ReactNode
}

/** Editor de orçamento controlado: peças, mão de obra e resumo em tempo real. */
export function BudgetEditor({
  value,
  onChange,
  catalog,
  precoHora,
  errors = NO_BUDGET_ERRORS,
  disabled,
  summaryFooter,
  notice,
}: BudgetEditorProps) {
  const configured = usePrecoHora()
  const hora = precoHora ?? configured
  const totals = useMemo(() => calcBudget(value), [value])

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="flex min-w-0 flex-col gap-8">
        {notice}
        <PecasSection
          pecas={value.pecas}
          onChange={(pecas) => onChange({ ...value, pecas })}
          catalog={catalog}
          errors={errors.pecas}
          disabled={disabled}
        />
        <MaoDeObraSection
          linhas={value.maoDeObra}
          onChange={(maoDeObra) => onChange({ ...value, maoDeObra })}
          precoHora={hora}
          errors={errors.maoDeObra}
          disabled={disabled}
        />
      </Card>
      <BudgetSummary totals={totals} footer={summaryFooter} />
    </div>
  )
}
