import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clientesApi } from '../../shared/api/clientes.ts'
import { getErrorMessage } from '../../shared/api/http.ts'
import { orcamentosApi } from '../../shared/api/orcamentos.ts'
import { ordensServicoApi } from '../../shared/api/ordensServico.ts'
import type { OrdemServico, Veiculo } from '../../shared/api/types.ts'
import { veiculosApi } from '../../shared/api/veiculos.ts'
import { formatBRL } from '../../shared/lib/money.ts'
import { sortAlpha } from '../../shared/lib/search.ts'
import { useResource } from '../../shared/lib/useResource.ts'
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  LinkButton,
  LoadingState,
  PageHeader,
  StatusBadge,
  useToast,
} from '../../shared/ui'
import type { DataColumn } from '../../shared/ui'
import { lastActivity } from '../ordens-servico/osUtils'
import { Placa } from '../veiculos/Placa'
import { ClienteForm } from './ClienteForm'

export function ClienteDetalhePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, error, isLoading, reload } = useResource(async (signal) => {
    const [cliente, veiculos, ordens, orcamentos] = await Promise.all([
      clientesApi.get(id, signal),
      veiculosApi.list({ clienteId: id }, signal),
      ordensServicoApi.list(signal),
      orcamentosApi.list(signal),
    ])
    return {
      cliente,
      veiculos: sortAlpha(veiculos, (v) => v.placa),
      orcamentoById: new Map(orcamentos.map((o) => [o.id, o])),
      ordens: ordens.filter((o) => o.clienteId === id).sort((a, b) => lastActivity(b) - lastActivity(a)),
    }
  }, [id])
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function remove() {
    setDeleting(true)
    try {
      await clientesApi.remove(id)
      toast.success('Cliente excluído.')
      navigate('/clientes')
    } catch (e) {
      toast.error(getErrorMessage(e))
      setConfirmingDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading && !data) return <Card><LoadingState label="Carregando cliente…" /></Card>
  if (!data) {
    return (
      <Alert
        tone="danger"
        title="Não foi possível carregar o cliente"
        action={<LinkButton to="/clientes" size="sm" variant="secondary">Voltar para clientes</LinkButton>}
      >
        {error}
      </Alert>
    )
  }

  const { cliente, veiculos, ordens, orcamentoById } = data
  const veiculoById = new Map(veiculos.map((v) => [v.id, v]))

  const veiculoColumns: DataColumn<Veiculo>[] = [
    { key: 'placa', header: 'Placa', cell: (v) => <Placa placa={v.placa} /> },
    { key: 'modelo', header: 'Marca / Modelo', cell: (v) => `${v.marca} ${v.modelo}` },
    { key: 'ano', header: 'Ano', className: 'tabular-nums', cell: (v) => v.ano },
  ]
  const ordemColumns: DataColumn<OrdemServico>[] = [
    { key: 'os', header: 'OS', cell: (o) => <span className="font-semibold tabular-nums">#{o.id.slice(-6)}</span> },
    {
      key: 'veiculo',
      header: 'Veículo',
      cell: (o) => {
        const v = veiculoById.get(o.veiculoId)
        return v ? <Placa placa={v.placa} /> : '—'
      },
    },
    { key: 'status', header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
    {
      key: 'valor',
      header: 'Valor do orçamento',
      className: 'text-right tabular-nums',
      cell: (o) => {
        const orcamento = orcamentoById.get(o.orcamentoId)
        return orcamento ? formatBRL(orcamento.valor) : '—'
      },
    },
  ]

  return (
    <>
      <PageHeader
        title={cliente.nome}
        description="Dados do cliente, veículos e ordens de serviço."
        actions={
          <>
            <LinkButton to="/clientes" variant="secondary">Voltar</LinkButton>
            <Button variant="secondary" icon="trash" className="text-danger" onClick={() => setConfirmingDelete(true)}>
              Excluir cliente
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-8">
        <ClienteForm key={cliente.id} initial={cliente} cancelTo="/clientes" onSaved={reload} />

        <section aria-labelledby="veiculos-cliente">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="veiculos-cliente" className="text-2xl font-bold">Veículos</h2>
            <LinkButton to={`/veiculos/novo?clienteId=${cliente.id}`} icon="plus" size="sm">Adicionar veículo</LinkButton>
          </div>
          <DataTable
            caption={`Veículos de ${cliente.nome}`}
            columns={veiculoColumns}
            rows={veiculos}
            rowKey={(v) => v.id}
            onRowClick={(v) => navigate(`/veiculos/${v.id}`)}
            empty={
              <EmptyState
                icon="veiculo"
                title="Nenhum veículo cadastrado"
                description="Adicione o primeiro veículo deste cliente."
                action={<LinkButton to={`/veiculos/novo?clienteId=${cliente.id}`} icon="plus">Adicionar veículo</LinkButton>}
              />
            }
          />
        </section>

        <section aria-labelledby="ordens-cliente">
          <h2 id="ordens-cliente" className="mb-3 text-2xl font-bold">Ordens de serviço</h2>
          <DataTable
            caption={`Ordens de serviço de ${cliente.nome}`}
            columns={ordemColumns}
            rows={ordens}
            rowKey={(o) => o.id}
            onRowClick={(o) => navigate(`/ordens-servico/${o.id}`)}
            empty={<EmptyState icon="ordem" title="Nenhuma ordem de serviço" description="As ordens abertas para este cliente aparecem aqui." />}
          />
        </section>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        tone="danger"
        title="Excluir cliente"
        message={
          <>
            Excluir <strong>{cliente.nome}</strong>? Esta ação não pode ser desfeita.
            {veiculos.length > 0
              ? ` Atenção: este cliente tem ${veiculos.length} ${veiculos.length === 1 ? 'veículo vinculado' : 'veículos vinculados'}, e o sistema só permite excluir depois de remover os veículos.`
              : ''}
          </>
        }
        confirmLabel="Excluir"
        isLoading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  )
}
