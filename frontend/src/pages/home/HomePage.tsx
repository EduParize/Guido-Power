import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useClientes } from '../../features/cliente/hooks/useClientes'
import { StatusBadge } from '../../features/ordem-servico/components/StatusBadge'
import { useOrdensServico } from '../../features/ordem-servico/hooks/useOrdensServico'
import { useVeiculos } from '../../features/veiculo/hooks/useVeiculos'
import { getHealth } from '../../shared/api/health'
import { Alert } from '../../shared/ui/Alert'
import { Card } from '../../shared/ui/Card'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Icon } from '../../shared/ui/Icon'
import { PageHeader } from '../../shared/ui/PageHeader'
import { StatCard } from '../../shared/ui/StatCard'

type ApiStatus = 'carregando' | 'online' | 'offline'

const STATUS_STYLES: Record<ApiStatus, { label: string; badge: string; dot: string }> = {
  carregando: { label: 'Verificando API', badge: 'bg-slate-100 text-slate-700 ring-slate-300', dot: 'bg-slate-400' },
  online: { label: 'API online', badge: 'bg-green-100 text-green-800 ring-green-300', dot: 'bg-green-500' },
  offline: { label: 'API offline', badge: 'bg-red-100 text-red-800 ring-red-300', dot: 'bg-red-500' },
}

const STATUS_ENCERRADOS = ['Finalizado', 'Cancelado']
const ULTIMAS_ORDENS = 5

export function HomePage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('carregando')
  const { clientes, isLoading: carregandoClientes, error: erroClientes } = useClientes()
  const { veiculos, isLoading: carregandoVeiculos, error: erroVeiculos } = useVeiculos()
  const { ordens, isLoading: carregandoOrdens, error: erroOrdens } = useOrdensServico()

  useEffect(() => {
    getHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))
  }, [])

  const erro = erroClientes ?? erroVeiculos ?? erroOrdens
  const abertas = ordens.filter((ordem) => !STATUS_ENCERRADOS.includes(ordem.status)).length
  const finalizadas = ordens.filter((ordem) => ordem.status === 'Finalizado').length
  const ultimas = ordens.slice(-ULTIMAS_ORDENS).reverse()
  const status = STATUS_STYLES[apiStatus]

  function total(valor: number, carregando: boolean) {
    return carregando ? '—' : valor
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-5">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="hidden h-24 w-auto shrink-0 rounded-xl sm:block"
        />
        <div className="min-w-0 flex-1">
      <PageHeader
        title="Início"
        description="Visão geral da oficina: clientes, veículos e ordens de serviço."
        actions={
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${status.badge}`}
            data-testid="api-status"
          >
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        }
      />
        </div>
      </div>

      {erro && <Alert variant="error">{erro}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clientes">{total(clientes.length, carregandoClientes)}</StatCard>
        <StatCard label="Veículos">{total(veiculos.length, carregandoVeiculos)}</StatCard>
        <StatCard label="Ordens abertas" hint="Em andamento ou aguardando">
          {total(abertas, carregandoOrdens)}
        </StatCard>
        <StatCard label="Ordens finalizadas">{total(finalizadas, carregandoOrdens)}</StatCard>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/ordens-servico/novo" className="btn-primary">
          <Icon name="plus" className="h-4 w-4" />
          Nova ordem de serviço
        </Link>
        <Link to="/clientes/novo" className="btn-secondary">
          <Icon name="plus" className="h-4 w-4" />
          Novo cliente
        </Link>
      </div>

      <Card title="Últimas ordens de serviço">
        {carregandoOrdens ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : ultimas.length === 0 ? (
          <EmptyState
            title="Nenhuma ordem de serviço cadastrada"
            action={
              <Link to="/ordens-servico/novo" className="btn-primary">
                Cadastrar ordem de serviço
              </Link>
            }
          />
        ) : (
          <ul className="-my-2 divide-y divide-slate-100">
            {ultimas.map((ordem) => (
              <li key={ordem.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    to={`/ordens-servico/${ordem.id}`}
                    className="font-semibold text-slate-900 hover:text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                  >
                    {ordem.descricao}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {clientes.find((cliente) => cliente.id === ordem.clienteId)?.nome ?? '-'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={ordem.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  )
}
