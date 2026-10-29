import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientesApi } from '../../shared/api/clientes.ts'
import { getErrorMessage } from '../../shared/api/http.ts'
import type { Cliente, Veiculo } from '../../shared/api/types.ts'
import { veiculosApi } from '../../shared/api/veiculos.ts'
import { matchesQuery, sortAlpha } from '../../shared/lib/search.ts'
import { useResource } from '../../shared/lib/useResource.ts'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  IconButton,
  LinkButton,
  LoadingState,
  PageHeader,
  SearchInput,
  useToast,
} from '../../shared/ui'
import type { DataColumn } from '../../shared/ui'
import { formatPlaca } from '../veiculos/format'
import { formatDocumento, formatTelefone } from './format'

const MAX_PLACAS = 3

interface Row {
  cliente: Cliente
  veiculos: Veiculo[]
}

function matches(row: Row, query: string): boolean {
  const c = row.cliente
  return matchesQuery(
    query,
    c.nome,
    c.documento,
    formatDocumento(c.documento),
    c.email,
    c.telefone,
    formatTelefone(c.telefone),
    ...row.veiculos.flatMap((v) => [v.placa, formatPlaca(v.placa), v.modelo, v.marca]),
  )
}

export function ClientesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, error, isLoading, reload } = useResource(async (signal) => {
    const [clientes, veiculos] = await Promise.all([clientesApi.list(signal), veiculosApi.list({}, signal)])
    return { clientes, veiculos }
  }, [])
  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState(false)

  const allRows = useMemo<Row[]>(() => {
    if (!data) return []
    const byDono = new Map<string, Veiculo[]>()
    for (const v of data.veiculos) byDono.set(v.dono, [...(byDono.get(v.dono) ?? []), v])
    return sortAlpha(data.clientes, (c) => c.nome).map((cliente) => ({ cliente, veiculos: byDono.get(cliente.id) ?? [] }))
  }, [data])
  const rows = useMemo(() => allRows.filter((r) => matches(r, query)), [allRows, query])

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await clientesApi.remove(toDelete.cliente.id)
      toast.success('Cliente excluído.')
      setToDelete(null)
      reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const columns: DataColumn<Row>[] = [
    { key: 'nome', header: 'Nome', cell: (r) => <span className="font-semibold">{r.cliente.nome}</span> },
    { key: 'documento', header: 'Documento', className: 'tabular-nums', cell: (r) => formatDocumento(r.cliente.documento) },
    { key: 'telefone', header: 'Telefone', className: 'tabular-nums', cell: (r) => formatTelefone(r.cliente.telefone) },
    { key: 'email', header: 'E-mail', cell: (r) => r.cliente.email },
    {
      key: 'veiculos',
      header: 'Veículos',
      cell: (r) =>
        r.veiculos.length === 0 ? (
          <span className="text-text-muted">Nenhum</span>
        ) : (
          <span className="flex flex-wrap gap-1.5">
            {r.veiculos.slice(0, MAX_PLACAS).map((v) => (
              <Badge key={v.id} className="font-mono tracking-wider">{formatPlaca(v.placa)}</Badge>
            ))}
            {r.veiculos.length > MAX_PLACAS ? <Badge tone="info">+{r.veiculos.length - MAX_PLACAS}</Badge> : null}
          </span>
        ),
    },
    {
      key: 'acoes',
      header: <span className="sr-only">Ações</span>,
      className: 'w-14 text-right',
      cell: (r) => (
        <IconButton
          aria-label={`Excluir ${r.cliente.nome}`}
          icon="trash"
          size="sm"
          className="text-danger"
          onClick={(e) => {
            e.stopPropagation()
            setToDelete(r)
          }}
        />
      ),
    },
  ]

  const novo = <LinkButton to="/clientes/novo" icon="plus">Novo cliente</LinkButton>
  const nVeiculos = toDelete?.veiculos.length ?? 0

  return (
    <>
      <PageHeader title="Clientes" description="Quem leva o carro para a oficina e os veículos de cada um." actions={novo} />

      {isLoading && !data ? (
        <Card><LoadingState label="Carregando clientes…" /></Card>
      ) : error && !data ? (
        <Alert
          tone="danger"
          title="Não foi possível carregar os clientes"
          action={<Button size="sm" variant="secondary" onClick={reload}>Tentar novamente</Button>}
        >
          {error}
        </Alert>
      ) : (
        <div className="flex flex-col gap-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            label="Buscar clientes"
            placeholder="Nome, documento, telefone, e-mail ou placa"
          />
          <DataTable
            caption="Clientes"
            columns={columns}
            rows={rows}
            rowKey={(r) => r.cliente.id}
            onRowClick={(r) => navigate(`/clientes/${r.cliente.id}`)}
            empty={
              allRows.length === 0 ? (
                <EmptyState icon="cliente" title="Nenhum cliente cadastrado" description="Cadastre o primeiro cliente para começar." action={novo} />
              ) : (
                <EmptyState icon="search" title="Nenhum cliente encontrado" description="Tente outro nome, documento, telefone ou placa." />
              )
            }
          />
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        tone="danger"
        title="Excluir cliente"
        message={
          toDelete ? (
            <>
              Excluir <strong>{toDelete.cliente.nome}</strong>? Esta ação não pode ser desfeita.
              {nVeiculos > 0
                ? ` Atenção: este cliente tem ${nVeiculos} ${nVeiculos === 1 ? 'veículo vinculado' : 'veículos vinculados'}, e o sistema só permite excluir depois de remover os veículos.`
                : ''}
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Excluir"
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
