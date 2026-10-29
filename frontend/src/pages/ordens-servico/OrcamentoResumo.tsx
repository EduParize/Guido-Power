import type { Orcamento } from '../../shared/api/types.ts'
import { formatBRL, round2 } from '../../shared/lib/money.ts'
import { Card, DataTable, DecisaoBadge, LinkButton } from '../../shared/ui'
import type { DataColumn } from '../../shared/ui'
import { placaLabel, shortId, telefoneLabel } from '../orcamentos/orcamentoUtils'

interface Linha {
  key: string
  descricao: string
  tipo: string
  quantidade: number
  valorUnitario: number
}

const COLUMNS: DataColumn<Linha>[] = [
  { key: 'descricao', header: 'Item', cell: (l) => l.descricao },
  { key: 'tipo', header: 'Tipo', cell: (l) => l.tipo },
  { key: 'qtd', header: 'Qtd.', className: 'text-right tabular-nums', cell: (l) => l.quantidade },
  { key: 'unit', header: 'Valor unitário', className: 'text-right tabular-nums', cell: (l) => formatBRL(l.valorUnitario) },
  { key: 'total', header: 'Subtotal', className: 'text-right tabular-nums', cell: (l) => formatBRL(round2(l.quantidade * l.valorUnitario)) },
]

/** Orçamento vinculado à OS, somente leitura: itens, total e decisão. Edição acontece na tela de orçamentos. */
export function OrcamentoResumo({ orcamento }: { orcamento: Orcamento }) {
  const linhas = orcamento.itens.map<Linha>((i, index) => ({
    key: String(index),
    descricao: i.descricao,
    tipo: i.tipo === 'PECA' ? 'Peça' : 'Mão de obra',
    quantidade: i.quantidade,
    valorUnitario: i.valorUnitario,
  }))
  return (
    <Card aria-label="Orçamento vinculado">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold">Orçamento {shortId(orcamento.id)}</h2>
          <DecisaoBadge decisao={orcamento.decisao} />
        </div>
        <LinkButton to={`/orcamentos/${orcamento.id}`} variant="secondary" size="sm">Abrir orçamento</LinkButton>
      </div>
      <p className="mb-4 text-[15px] text-text-muted">
        {[orcamento.nome, telefoneLabel(orcamento) !== '—' ? telefoneLabel(orcamento) : null, orcamento.placa ? placaLabel(orcamento) : null]
          .filter(Boolean)
          .join(' · ') || 'Sem dados de contato'}
      </p>
      <DataTable
        caption="Itens do orçamento"
        columns={COLUMNS}
        rows={linhas}
        rowKey={(l) => l.key}
        empty={<p className="px-4 py-5 text-base text-text-muted">Orçamento sem itens.</p>}
      />
      <p className="mt-4 text-right text-base text-text-muted">
        Total <span className="ml-2 font-display text-3xl font-bold text-text tabular-nums">{formatBRL(orcamento.valor)}</span>
      </p>
    </Card>
  )
}
