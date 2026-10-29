import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../shared/api/http.ts'
import { orcamentosApi } from '../../shared/api/orcamentos.ts'
import { DECISAO_LABEL, DECISOES } from '../../shared/api/types.ts'
import type { DecisaoOrcamento, Orcamento } from '../../shared/api/types.ts'
import { formatBRL } from '../../shared/lib/money.ts'
import { matchesQuery, sortAlpha } from '../../shared/lib/search.ts'
import { useResource } from '../../shared/lib/useResource.ts'
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  DecisaoBadge,
  EmptyState,
  IconButton,
  LinkButton,
  LoadingState,
  PageHeader,
  SearchInput,
  Select,
  useToast,
} from '../../shared/ui'
import type { DataColumn } from '../../shared/ui'
import { formatPlaca } from '../veiculos/format'
import { placaLabel, shortId, telefoneLabel } from './orcamentoUtils'

export function OrcamentosPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, error, isLoading, reload } = useResource((signal) => orcamentosApi.list(signal), [])
  const [query, setQuery] = useState('')
  const [decisao, setDecisao] = useState<DecisaoOrcamento | ''>('')
  const [removing, setRemoving] = useState<Orcamento | null>(null)
  const [busy, setBusy] = useState(false)

  const rows = useMemo(() => {
    const filtered = (data ?? []).filter(
      (o) =>
        (!decisao || o.decisao === decisao) &&
        matchesQuery(query, o.nome, o.placa, o.placa ? formatPlaca(o.placa) : '', o.telefone, telefoneLabel(o), o.id.slice(-6)),
    )
    // A–Z por nome; orçamentos sem nome vão para o fim.
    const nomeados = sortAlpha(filtered.filter((o) => o.nome), (o) => o.nome ?? '')
    return [...nomeados, ...filtered.filter((o) => !o.nome)]
  }, [data, query, decisao])

  async function confirmRemove() {
    if (!removing) return
    setBusy(true)
    try {
      await orcamentosApi.remove(removing.id)
      toast.success('Orçamento excluído')
      setRemoving(null)
      reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const columns: DataColumn<Orcamento>[] = [
    { key: 'nome', header: 'Nome', cell: (o) => <span className="font-semibold">{o.nome || `Sem nome ${shortId(o.id)}`}</span> },
    { key: 'placa', header: 'Placa', cell: (o) => <span className="font-mono">{placaLabel(o)}</span> },
    { key: 'telefone', header: 'Telefone', cell: (o) => <span className="tabular-nums">{telefoneLabel(o)}</span> },
    {
      key: 'valor',
      header: 'Valor',
      className: 'text-right tabular-nums',
      cell: (o) => <span className="text-lg font-bold">{formatBRL(o.valor)}</span>,
    },
    { key: 'decisao', header: 'Decisão', cell: (o) => <DecisaoBadge decisao={o.decisao} /> },
    {
      key: 'acoes',
      header: <span className="sr-only">Ações</span>,
      className: 'w-28 text-right',
      cell: (o) => (
        <span className="inline-flex gap-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <IconButton aria-label={`Editar orçamento ${shortId(o.id)}`} icon="edit" size="sm" onClick={() => navigate(`/orcamentos/${o.id}`)} />
          <IconButton aria-label={`Excluir orçamento ${shortId(o.id)}`} icon="trash" size="sm" className="text-danger" onClick={() => setRemoving(o)} />
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Monte o orçamento com peças e mão de obra. Aprovado, ele vira cliente, veículo e ordem de serviço."
        actions={<LinkButton to="/orcamentos/novo" icon="plus">Novo orçamento</LinkButton>}
      />
      {isLoading && !data ? (
        <Card><LoadingState label="Carregando orçamentos…" /></Card>
      ) : error && !data ? (
        <Alert tone="danger" title="Não foi possível carregar os orçamentos" action={<Button size="sm" variant="secondary" onClick={reload}>Tentar novamente</Button>}>
          {error}
        </Alert>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={query} onChange={setQuery} label="Buscar orçamentos" placeholder="Nome, placa ou telefone" className="sm:max-w-md" />
            <div className="flex items-center gap-2">
              <label htmlFor="orc-decisao" className="text-[15px] font-semibold">Decisão</label>
              <div className="w-48">
                <Select id="orc-decisao" value={decisao} onChange={(e) => setDecisao(e.target.value as DecisaoOrcamento | '')} placeholder="Todas">
                  {DECISOES.map((d) => (
                    <option key={d} value={d}>{DECISAO_LABEL[d]}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
          <DataTable
            caption="Orçamentos"
            columns={columns}
            rows={rows}
            rowKey={(o) => o.id}
            onRowClick={(o) => navigate(`/orcamentos/${o.id}`)}
            empty={
              (data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon="orcamento"
                  title="Nenhum orçamento ainda"
                  description="Crie o primeiro orçamento com o contato do cliente e os itens."
                  action={<LinkButton to="/orcamentos/novo" icon="plus">Novo orçamento</LinkButton>}
                />
              ) : (
                <EmptyState
                  icon="search"
                  title="Nenhum orçamento encontrado"
                  description="Ajuste a busca ou o filtro de decisão."
                  action={<Button variant="secondary" onClick={() => { setQuery(''); setDecisao('') }}>Limpar filtros</Button>}
                />
              )
            }
          />
        </div>
      )}
      <ConfirmDialog
        open={removing !== null}
        tone="danger"
        title="Excluir orçamento"
        message={removing ? `Excluir o orçamento ${removing.nome || shortId(removing.id)} de ${formatBRL(removing.valor)}? Orçamentos vinculados a uma ordem de serviço não podem ser excluídos.` : ''}
        confirmLabel="Excluir orçamento"
        isLoading={busy}
        onCancel={() => setRemoving(null)}
        onConfirm={() => void confirmRemove()}
      />
    </>
  )
}
