import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useClientes } from '../../features/cliente/hooks/useClientes'
import { EventosPanel } from '../../features/ordem-servico/components/EventosPanel'
import { formatMoeda } from '../../features/ordem-servico/components/formatMoeda'
import { OrcamentoPanel } from '../../features/ordem-servico/components/OrcamentoPanel'
import { OrdemServicoForm } from '../../features/ordem-servico/components/OrdemServicoForm'
import { StatusBadge } from '../../features/ordem-servico/components/StatusBadge'
import { useEventos } from '../../features/ordem-servico/hooks/useEventos'
import { useOrcamento } from '../../features/ordem-servico/hooks/useOrcamento'
import { useOrdemServico } from '../../features/ordem-servico/hooks/useOrdemServico'
import { DECISAO_LABELS } from '../../features/ordem-servico/types'
import type { EventoInput, OrdemServicoInput } from '../../features/ordem-servico/types'
import { useVeiculos } from '../../features/veiculo/hooks/useVeiculos'
import { Alert } from '../../shared/ui/Alert'
import { PageHeader } from '../../shared/ui/PageHeader'
import { StatCard } from '../../shared/ui/StatCard'

export function OrdemServicoDetalhePage() {
  const { id = '' } = useParams()
  const { ordem, isLoading, isSaving, error, update, reload } = useOrdemServico(id)
  const eventos = useEventos(id)
  const orcamento = useOrcamento(id)
  const { clientes } = useClientes()
  const { veiculos } = useVeiculos()
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function handleSubmit(input: OrdemServicoInput) {
    setMensagem(null)
    const salva = await update(input)
    if (salva) setMensagem('Ordem atualizada')
  }

  async function handleAddEvento(input: EventoInput) {
    const ok = await eventos.add(input)
    if (ok) await reload()
    return ok
  }

  async function handleReenviar(eventoId: string) {
    const ok = await eventos.reenviar(eventoId)
    if (ok) await reload()
    return ok
  }

  if (isLoading) return <p className="text-sm text-slate-500">Carregando...</p>

  if (!ordem) return <Alert variant="error">{error ?? 'Ordem de serviço não encontrada'}</Alert>

  const cliente = clientes.find((item) => item.id === ordem.clienteId)
  const veiculo = veiculos.find((item) => item.id === ordem.veiculoId)

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={ordem.descricao}
        description={`Ordem de serviço · decisão ${DECISAO_LABELS[ordem.decisao].toLowerCase()}`}
        actions={<StatusBadge status={ordem.status} />}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cliente">
          <span className="text-base">{cliente?.nome ?? '-'}</span>
        </StatCard>
        <StatCard label="Veículo" hint={veiculo ? `${veiculo.marca} ${veiculo.modelo}` : undefined}>
          {veiculo ? <span className="plate">{veiculo.placa}</span> : '-'}
        </StatCard>
        <StatCard label="Decisão" hint={new Date(ordem.decisaoData).toLocaleString('pt-BR')}>
          <span className="text-base">{DECISAO_LABELS[ordem.decisao]}</span>
        </StatCard>
        <StatCard label="Orçamento" highlight>
          {orcamento.isLoading
            ? '...'
            : orcamento.orcamento
              ? formatMoeda(orcamento.orcamento.valor)
              : 'Sem orçamento'}
        </StatCard>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {mensagem && <Alert variant="success">{mensagem}</Alert>}
      <OrdemServicoForm
        key={ordem.id}
        modo="editar"
        valores={ordem}
        clientes={clientes}
        veiculos={veiculos}
        isSaving={isSaving}
        onSubmit={handleSubmit}
      />
      <OrcamentoPanel
        orcamento={orcamento.orcamento}
        isLoading={orcamento.isLoading}
        isSaving={orcamento.isSaving}
        error={orcamento.error}
        onSave={orcamento.save}
        onRemove={orcamento.remove}
      />
      <EventosPanel
        eventos={eventos.eventos}
        statusAtual={ordem.status}
        isLoading={eventos.isLoading}
        isSaving={eventos.isSaving}
        error={eventos.error}
        onAdd={handleAddEvento}
        onReenviar={handleReenviar}
      />
    </div>
  )
}
