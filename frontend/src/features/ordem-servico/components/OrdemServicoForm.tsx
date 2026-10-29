import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../../shared/ui/Card'
import type { Cliente } from '../../cliente/types'
import type { Veiculo } from '../../veiculo/types'
import { DECISAO_LABELS, DECISOES, STATUS_COM_MOTIVO, STATUS_LABELS, STATUS_ORDEM } from '../types'
import type {
  DecisaoOrdem,
  OrdemServico,
  OrdemServicoCreateInput,
  OrdemServicoInput,
  StatusOrdem,
} from '../types'

type OrdemServicoFormProps = {
  valores?: OrdemServico
  clientes: Cliente[]
  veiculos: Veiculo[]
  isSaving: boolean
} & (
  | { modo: 'criar'; onSubmit: (input: OrdemServicoCreateInput) => void }
  | { modo: 'editar'; onSubmit: (input: OrdemServicoInput) => void }
)

export function OrdemServicoForm({
  valores,
  clientes,
  veiculos,
  isSaving,
  modo,
  onSubmit,
}: OrdemServicoFormProps) {
  const [clienteId, setClienteId] = useState(valores?.clienteId ?? '')
  const [veiculoId, setVeiculoId] = useState(valores?.veiculoId ?? '')
  const [descricao, setDescricao] = useState(valores?.descricao ?? '')
  const [decisao, setDecisao] = useState<DecisaoOrdem>(valores?.decisao ?? 'PENDENTE')
  const [status, setStatus] = useState<StatusOrdem>('Em espera')
  const [motivo, setMotivo] = useState('')

  const veiculosDoCliente = veiculos.filter((veiculo) => veiculo.dono === clienteId)
  const motivoObrigatorio = modo === 'criar' && STATUS_COM_MOTIVO.includes(status)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const base: OrdemServicoInput = {
      clienteId,
      veiculoId,
      descricao,
      decisao,
    }
    if (modo === 'editar') {
      onSubmit(base)
      return
    }
    onSubmit(motivoObrigatorio ? { ...base, status, motivo: motivo.trim() } : { ...base, status })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset>
          <legend className="form-section-title w-full">Cliente e veículo</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              Cliente
              <select
                className="input mt-1"
                required
                value={clienteId}
                onChange={(e) => {
                  setClienteId(e.target.value)
                  setVeiculoId('')
                }}
              >
                <option value="">Selecione</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Veículo
              <select
                className="input mt-1"
                required
                disabled={!clienteId}
                value={veiculoId}
                onChange={(e) => setVeiculoId(e.target.value)}
              >
                <option value="">Selecione</option>
                {veiculosDoCliente.map((veiculo) => (
                  <option key={veiculo.id} value={veiculo.id}>
                    {veiculo.placa} - {veiculo.marca} {veiculo.modelo}
                  </option>
                ))}
              </select>
              {!clienteId && <span className="field-hint">Selecione um cliente primeiro</span>}
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="form-section-title w-full">Serviço</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label sm:col-span-2">
              Descrição
              <textarea
                className="input mt-1"
                rows={3}
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </label>
            <label className="field-label">
              Decisão
              <select
                className="input mt-1"
                value={decisao}
                onChange={(e) => setDecisao(e.target.value as DecisaoOrdem)}
              >
                {DECISOES.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {DECISAO_LABELS[opcao]}
                  </option>
                ))}
              </select>
            </label>
            {modo === 'criar' && (
              <label className="field-label">
                Status
                <select
                  className="input mt-1"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusOrdem)}
                >
                  {STATUS_ORDEM.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {STATUS_LABELS[opcao]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {motivoObrigatorio && (
              <label className="field-label sm:col-span-2">
                Motivo
                <textarea
                  className="input mt-1"
                  rows={2}
                  required
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
                <span className="field-hint">Obrigatório para este status</span>
              </label>
            )}
          </div>
        </fieldset>

        <div className="form-footer">
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <Link to="/ordens-servico" className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </Card>
  )
}
