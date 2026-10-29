import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STATUS_ORDEM } from '../../shared/api/types.ts'
import type { OrdemServico, StatusOrdem } from '../../shared/api/types.ts'
import { formatBRL } from '../../shared/lib/money.ts'
import { matchesQuery, sortAlpha } from '../../shared/lib/search.ts'
import {
  Alert,
  Button,
  Card,
  DataTable,
  EmptyState,
  LinkButton,
  LoadingState,
  PageHeader,
  SearchInput,
  Select,
  StatusBadge,
  cn,
} from '../../shared/ui'
import type { DataColumn } from '../../shared/ui'
import { clienteNome, dateTimeFmt, lastActivity, shortId, veiculoLabel } from './osUtils'
import { useCadastros } from './useCadastros'

type SortMode = 'cliente' | 'recentes'

export function OrdensServicoPage() {
  const navigate = useNavigate()
  const cadastros = useCadastros()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusOrdem | ''>('')
  const [sort, setSort] = useState<SortMode>('cliente')

  const rows = useMemo(() => {
    const all = cadastros.ordens ?? []
    const nome = (o: OrdemServico) => clienteNome(cadastros.clienteById, o.clienteId)
    const filtered = all.filter((o) => {
      if (status && o.status !== status) return false
      const v = cadastros.veiculoById.get(o.veiculoId)
      return matchesQuery(query, nome(o), v?.placa, v?.modelo, v?.marca, o.descricao, o.status, o.id.slice(-6))
    })
    return sort === 'cliente'
      ? sortAlpha(filtered, nome)
      : [...filtered].sort((a, b) => lastActivity(b) - lastActivity(a))
  }, [cadastros.ordens, cadastros.clienteById, cadastros.veiculoById, query, status, sort])

  const counts = useMemo(() => {
    const map = new Map<StatusOrdem, number>()
    for (const o of cadastros.ordens ?? []) map.set(o.status, (map.get(o.status) ?? 0) + 1)
    return map
  }, [cadastros.ordens])

  const columns: DataColumn<OrdemServico>[] = [
    { key: 'id', header: 'Nº', cell: (o) => <span className="font-semibold tabular-nums">{shortId(o.id)}</span> },
    { key: 'cliente', header: 'Cliente', cell: (o) => <span className="font-semibold">{clienteNome(cadastros.clienteById, o.clienteId)}</span> },
    { key: 'veiculo', header: 'Veículo', cell: (o) => veiculoLabel(cadastros.veiculoById.get(o.veiculoId)) },
    {
      key: 'descricao',
      header: 'Descrição',
      cell: (o) => (
        <span title={o.descricao} className="block max-w-xs truncate">
          {o.descricao}
        </span>
      ),
    },
    { key: 'status', header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
    {
      key: 'valor',
      header: 'Valor do orçamento',
      className: 'text-right tabular-nums',
      cell: (o) => {
        const orcamento = cadastros.orcamentoById.get(o.orcamentoId)
        return orcamento ? formatBRL(orcamento.valor) : '—'
      },
    },
    {
      key: 'atualizada',
      header: 'Atualizada em',
      className: 'text-text-muted',
      cell: (o) => {
        const t = lastActivity(o)
        return t ? dateTimeFmt.format(t) : '—'
      },
    },
  ]

  const loading = cadastros.isLoading && !cadastros.ordens
  const error = cadastros.error

  return (
    <>
      <PageHeader
        title="Ordens de serviço"
        description="Acompanhe cada veículo na oficina, do diagnóstico à entrega."
        actions={<LinkButton to="/ordens-servico/nova" icon="plus">Nova OS</LinkButton>}
      />
      {loading ? (
        <Card><LoadingState label="Carregando ordens de serviço…" /></Card>
      ) : error && !cadastros.ordens ? (
        <Alert
          tone="danger"
          title="Não foi possível carregar as ordens de serviço"
          action={<Button size="sm" variant="secondary" onClick={cadastros.reload}>Tentar novamente</Button>}
        >
          {error}
        </Alert>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              label="Buscar ordens de serviço"
              placeholder="Cliente, placa, modelo, descrição ou status"
              className="sm:max-w-md"
            />
            <div className="flex items-center gap-2">
              <label htmlFor="os-ordem" className="text-[15px] font-semibold">Ordenar por</label>
              <div className="w-48">
                <Select id="os-ordem" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
                  <option value="cliente">Cliente (A–Z)</option>
                  <option value="recentes">Mais recentes</option>
                </Select>
              </div>
            </div>
          </div>
          <div role="group" aria-label="Filtrar por status" className="flex flex-wrap gap-2">
            <Chip active={status === ''} onClick={() => setStatus('')} label="Todas" count={cadastros.ordens?.length ?? 0} />
            {STATUS_ORDEM.map((s) => (
              <Chip key={s} active={status === s} onClick={() => setStatus(status === s ? '' : s)} label={s} count={counts.get(s) ?? 0} />
            ))}
          </div>
          <p className="text-sm text-text-muted" aria-live="polite">
            {rows.length} {rows.length === 1 ? 'ordem encontrada' : 'ordens encontradas'}
          </p>
          <DataTable
            caption="Ordens de serviço"
            columns={columns}
            rows={rows}
            rowKey={(o) => o.id}
            onRowClick={(o) => navigate(`/ordens-servico/${o.id}`)}
            empty={
              (cadastros.ordens?.length ?? 0) === 0 ? (
                <EmptyState
                  title="Nenhuma ordem de serviço ainda"
                  description="Cadastre a primeira ordem para acompanhá-la por aqui."
                  action={<LinkButton to="/ordens-servico/nova" icon="plus">Nova OS</LinkButton>}
                />
              ) : (
                <EmptyState
                  icon="search"
                  title="Nenhuma ordem encontrada"
                  description="Ajuste a busca ou o filtro de status."
                  action={<Button variant="secondary" onClick={() => { setQuery(''); setStatus('') }}>Limpar filtros</Button>}
                />
              )
            }
          />
        </div>
      )}
    </>
  )
}

function Chip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold transition-colors contrast:border-2',
        active
          ? 'border-primary bg-primary text-primary-contrast'
          : 'border-border-strong bg-surface text-text hover:bg-surface-muted',
      )}
    >
      {label}
      <span className={cn('text-sm tabular-nums', active ? 'opacity-90' : 'text-text-muted')}>{count}</span>
    </button>
  )
}
