import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clientesApi } from '../../shared/api/clientes.ts'
import { getErrorMessage } from '../../shared/api/http.ts'
import type { Veiculo } from '../../shared/api/types.ts'
import { veiculosApi } from '../../shared/api/veiculos.ts'
import { matchesQuery, sortAlpha } from '../../shared/lib/search.ts'
import { useResource } from '../../shared/lib/useResource.ts'
import {
  Alert,
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
import { formatPlaca } from './format'
import { Placa } from './Placa'

interface Row {
  veiculo: Veiculo
  dono: string
}

export function VeiculosPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, error, isLoading, reload } = useResource(async (signal) => {
    const [veiculos, clientes] = await Promise.all([veiculosApi.list({}, signal), clientesApi.list(signal)])
    return { veiculos, clientes }
  }, [])
  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState(false)

  const allRows = useMemo<Row[]>(() => {
    if (!data) return []
    const nomes = new Map(data.clientes.map((c) => [c.id, c.nome]))
    return sortAlpha(data.veiculos, (v) => v.placa).map((veiculo) => ({ veiculo, dono: nomes.get(veiculo.dono) ?? '' }))
  }, [data])
  const rows = useMemo(
    () =>
      allRows.filter(({ veiculo: v, dono }) =>
        matchesQuery(query, v.placa, formatPlaca(v.placa), v.marca, v.modelo, v.ano, dono),
      ),
    [allRows, query],
  )

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await veiculosApi.remove(toDelete.veiculo.id)
      toast.success('Veículo excluído.')
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
    { key: 'placa', header: 'Placa', cell: (r) => <Placa placa={r.veiculo.placa} /> },
    { key: 'modelo', header: 'Marca / Modelo', cell: (r) => <span className="font-semibold">{r.veiculo.marca} {r.veiculo.modelo}</span> },
    { key: 'ano', header: 'Ano', className: 'tabular-nums', cell: (r) => r.veiculo.ano },
    {
      key: 'dono',
      header: 'Dono',
      cell: (r) =>
        r.dono ? (
          <Link
            to={`/clientes/${r.veiculo.dono}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            {r.dono}
          </Link>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: 'acoes',
      header: <span className="sr-only">Ações</span>,
      className: 'w-14 text-right',
      cell: (r) => (
        <IconButton
          aria-label={`Excluir veículo ${formatPlaca(r.veiculo.placa)}`}
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

  const novo = <LinkButton to="/veiculos/novo" icon="plus">Novo veículo</LinkButton>

  return (
    <>
      <PageHeader title="Veículos" description="Todos os veículos cadastrados e seus donos." actions={novo} />

      {isLoading && !data ? (
        <Card><LoadingState label="Carregando veículos…" /></Card>
      ) : error && !data ? (
        <Alert
          tone="danger"
          title="Não foi possível carregar os veículos"
          action={<Button size="sm" variant="secondary" onClick={reload}>Tentar novamente</Button>}
        >
          {error}
        </Alert>
      ) : (
        <div className="flex flex-col gap-4">
          <SearchInput value={query} onChange={setQuery} label="Buscar veículos" placeholder="Placa, marca, modelo, ano ou dono" />
          <DataTable
            caption="Veículos"
            columns={columns}
            rows={rows}
            rowKey={(r) => r.veiculo.id}
            onRowClick={(r) => navigate(`/veiculos/${r.veiculo.id}`)}
            empty={
              allRows.length === 0 ? (
                <EmptyState icon="veiculo" title="Nenhum veículo cadastrado" description="Cadastre o primeiro veículo para abrir ordens de serviço." action={novo} />
              ) : (
                <EmptyState icon="search" title="Nenhum veículo encontrado" description="Tente outra placa, marca, modelo, ano ou dono." />
              )
            }
          />
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        tone="danger"
        title="Excluir veículo"
        message={
          toDelete ? (
            <>
              Excluir o veículo <strong>{formatPlaca(toDelete.veiculo.placa)}</strong>? Esta ação não pode ser desfeita. O sistema
              não permite excluir veículos que já têm ordens de serviço.
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
