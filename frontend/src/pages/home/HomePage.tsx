import { useNavigate } from 'react-router-dom'
import { clientesApi } from '../../shared/api/clientes.ts'
import { veiculosApi } from '../../shared/api/veiculos.ts'
import { orcamentosApi } from '../../shared/api/orcamentos.ts'
import { ordensServicoApi } from '../../shared/api/ordensServico.ts'
import type { Cliente, Orcamento, OrdemServico, Veiculo } from '../../shared/api/types.ts'
import { useAuth } from '../../shared/auth'
import { formatBRL, round2 } from '../../shared/lib/money.ts'
import { useResource } from '../../shared/lib/useResource.ts'
import {
  Alert,
  Button,
  Card,
  DataTable,
  EmptyState,
  Icon,
  LinkButton,
  LoadingState,
  PageHeader,
  StatusBadge,
  cn,
} from '../../shared/ui'
import type { DataColumn, IconName } from '../../shared/ui'
import { lastActivity } from '../ordens-servico/osUtils'

const RECENT_LIMIT = 8
const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

interface DashboardData {
  ordens: OrdemServico[]
  clientes: Cliente[]
  veiculos: Veiculo[]
  orcamentos: Orcamento[]
}

const isOpen = (o: OrdemServico) => o.status !== 'Finalizado' && o.status !== 'Cancelado'

function todayLabel() {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
}

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, error, isLoading, reload } = useResource<DashboardData>(async (signal) => {
    const [ordens, clientes, veiculos, orcamentos] = await Promise.all([
      ordensServicoApi.list(signal),
      clientesApi.list(signal),
      veiculosApi.list({}, signal),
      orcamentosApi.list(signal),
    ])
    return { ordens, clientes, veiculos, orcamentos }
  }, [])

  const firstName = user?.nome.trim().split(/\s+/)[0] ?? ''

  return (
    <>
      <PageHeader
        title={firstName ? `Olá, ${firstName}` : 'Painel'}
        description={`Hoje é ${todayLabel()}. Veja o que está em andamento na oficina.`}
        actions={
          <>
            <LinkButton to="/ordens-servico/nova" icon="plus">Nova OS</LinkButton>
            <LinkButton to="/clientes/novo" variant="secondary" icon="cliente">Novo cliente</LinkButton>
          </>
        }
      />

      {isLoading && !data ? (
        <Card><LoadingState label="Carregando painel…" /></Card>
      ) : error && !data ? (
        <Alert
          tone="danger"
          title="Não foi possível carregar o painel"
          action={<Button size="sm" variant="secondary" onClick={reload}>Tentar novamente</Button>}
        >
          {error}
        </Alert>
      ) : data ? (
        <Dashboard data={data} onOpen={(id) => navigate(`/ordens-servico/${id}`)} />
      ) : null}
    </>
  )
}

function Dashboard({ data, onOpen }: { data: DashboardData; onOpen: (id: string) => void }) {
  const { ordens, clientes, veiculos, orcamentos } = data
  const abertas = ordens.filter(isOpen)
  const aguardando = orcamentos.filter((o) => o.decisao === 'PENDENTE').length
  const finalizadas = ordens.filter((o) => o.status === 'Finalizado').length
  const orcamentoById = new Map(orcamentos.map((o) => [o.id, o]))
  const valorAbertas = round2(abertas.reduce((sum, o) => sum + (orcamentoById.get(o.orcamentoId)?.valor ?? 0), 0))

  const clienteNome = new Map(clientes.map((c) => [c.id, c.nome]))
  const veiculoById = new Map(veiculos.map((v) => [v.id, v]))
  const recentes = [...ordens].sort((a, b) => lastActivity(b) - lastActivity(a)).slice(0, RECENT_LIMIT)

  const columns: DataColumn<OrdemServico>[] = [
    {
      key: 'os',
      header: 'OS',
      cell: (o) => <span className="font-semibold tabular-nums">#{o.id.slice(-6)}</span>,
    },
    { key: 'cliente', header: 'Cliente', cell: (o) => clienteNome.get(o.clienteId) ?? '—' },
    {
      key: 'veiculo',
      header: 'Veículo',
      cell: (o) => {
        const v = veiculoById.get(o.veiculoId)
        return v ? `${v.marca} ${v.modelo} · ${v.placa}` : '—'
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
    {
      key: 'atualizada',
      header: 'Atualizada em',
      className: 'text-text-muted',
      cell: (o) => {
        const t = lastActivity(o)
        return t ? dateFmt.format(t) : '—'
      },
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Resumo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon="ordem" label="Ordens abertas" value={String(abertas.length)} featured />
        <Kpi icon="alert" label="Orçamentos aguardando decisão" value={String(aguardando)} />
        <Kpi icon="check" label="Ordens finalizadas" value={String(finalizadas)} />
        <Kpi icon="orcamento" label="Valor em ordens abertas" value={formatBRL(valorAbertas)} />
      </section>

      <section aria-labelledby="recentes">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 id="recentes" className="text-2xl font-bold">Ordens recentes</h2>
          <LinkButton to="/ordens-servico" variant="ghost" size="sm">Ver todas</LinkButton>
        </div>
        <DataTable
          caption="Ordens de serviço com atividade mais recente"
          columns={columns}
          rows={recentes}
          rowKey={(o) => o.id}
          onRowClick={(o) => onOpen(o.id)}
          empty={
            <EmptyState
              title="Nenhuma ordem de serviço ainda"
              description="Cadastre a primeira ordem para acompanhá-la por aqui."
              action={<LinkButton to="/ordens-servico/nova" icon="plus">Nova OS</LinkButton>}
            />
          }
        />
      </section>
    </div>
  )
}

function Kpi({ icon, label, value, featured = false }: { icon: IconName; label: string; value: string; featured?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-start gap-4 rounded-lg border p-5 shadow-card',
        featured ? 'border-primary bg-primary text-primary-contrast' : 'border-border bg-surface text-text',
      )}
    >
      <span
        className={cn(
          'grid h-11 w-11 shrink-0 place-items-center rounded-lg',
          featured ? 'bg-primary-contrast/15' : 'bg-primary-soft text-primary-soft-text',
        )}
      >
        <Icon name={icon} size={22} />
      </span>
      <div className="min-w-0">
        <p className="font-display text-3xl leading-none font-bold tabular-nums">{value}</p>
        <p className={cn('mt-2 text-base font-medium', featured ? 'text-primary-contrast' : 'text-text-muted')}>{label}</p>
      </div>
    </div>
  )
}
