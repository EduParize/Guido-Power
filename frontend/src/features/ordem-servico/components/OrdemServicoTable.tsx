import { Link } from 'react-router-dom'
import { EmptyState } from '../../../shared/ui/EmptyState'
import type { Cliente } from '../../cliente/types'
import type { Veiculo } from '../../veiculo/types'
import { DECISAO_LABELS } from '../types'
import type { OrdemServico } from '../types'
import { formatMoeda } from './formatMoeda'
import { StatusBadge } from './StatusBadge'

interface OrdemServicoTableProps {
  ordens: OrdemServico[]
  clientes: Cliente[]
  veiculos: Veiculo[]
  onRemove: (ordem: OrdemServico) => void
}

export function OrdemServicoTable({ ordens, clientes, veiculos, onRemove }: OrdemServicoTableProps) {
  if (ordens.length === 0) {
    return (
      <EmptyState
        title="Nenhuma ordem de serviço cadastrada"
        description="Abra a primeira ordem para acompanhar o serviço da oficina."
        action={
          <Link to="/ordens-servico/novo" className="btn-primary">
            Cadastrar ordem de serviço
          </Link>
        }
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="table-head">
          <tr>
            <th className="px-4 py-3">Descrição</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Veículo</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Decisão</th>
            <th className="px-4 py-3 text-right">Orçamento</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {ordens.map((ordem) => {
            const placa = veiculos.find((veiculo) => veiculo.id === ordem.veiculoId)?.placa

            return (
              <tr key={ordem.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{ordem.descricao}</td>
                <td className="px-4 py-3 text-slate-700">
                  {clientes.find((cliente) => cliente.id === ordem.clienteId)?.nome ?? '-'}
                </td>
                <td className="px-4 py-3">
                  {placa ? <span className="plate">{placa}</span> : '-'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ordem.status} />
                </td>
                <td className="px-4 py-3 text-slate-700">{DECISAO_LABELS[ordem.decisao]}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                  {formatMoeda(ordem.orcamento)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      to={`/ordens-servico/${ordem.id}`}
                      className="btn-ghost"
                      aria-label={`Abrir ${ordem.descricao}`}
                    >
                      Abrir
                    </Link>
                    <button
                      type="button"
                      className="btn-ghost-danger"
                      aria-label={`Excluir ${ordem.descricao}`}
                      onClick={() => onRemove(ordem)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
