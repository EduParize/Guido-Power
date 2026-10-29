import type { ReactNode } from 'react'
import type { BudgetTotals } from '../../shared/lib/budget.ts'
import { formatBRL } from '../../shared/lib/money.ts'
import { Card } from '../../shared/ui'

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-base text-text-muted">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">
        {formatBRL(value)}
      </dd>
    </div>
  )
}

/** Painel do orçamento: recalculado a cada alteração; fixo à direita em telas largas. */
export function BudgetSummary({ totals, footer }: { totals: BudgetTotals; footer?: ReactNode }) {
  return (
    <Card aria-label="Resumo do orçamento" className="xl:sticky xl:top-6">
      <h3 className="text-xl font-bold">Resumo</h3>
      <dl className="mt-4 flex flex-col gap-2.5">
        <Row label="Total de peças" value={totals.totalPecas} />
        <Row label="Total de mão de obra" value={totals.totalMaoDeObra} />
      </dl>
      <div className="mt-4 rounded-lg bg-primary-soft px-4 py-3 text-primary-soft-text contrast:border-2 contrast:border-text">
        <p className="text-base font-semibold">Total</p>
        <p className="font-display text-4xl leading-tight font-bold tabular-nums" data-testid="budget-total">
          {formatBRL(totals.total)}
        </p>
      </div>
      {footer ? <div className="mt-5 flex flex-col gap-3">{footer}</div> : null}
    </Card>
  )
}
