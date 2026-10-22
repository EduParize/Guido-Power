import { Link } from 'react-router-dom'
import type { Cliente } from '../../cliente/types'
import type { Veiculo } from '../types'

interface VeiculoTableProps {
  veiculos: Veiculo[]
  clientes: Cliente[]
  onRemove: (veiculo: Veiculo) => void
}

export function VeiculoTable({ veiculos, clientes, onRemove }: VeiculoTableProps) {
  function nomeDoDono(clienteId: string) {
    return clientes.find((cliente) => cliente.id === clienteId)?.nome ?? '—'
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="table-head">
          <tr>
            <th className="px-4 py-3">Placa</th>
            <th className="px-4 py-3">Marca</th>
            <th className="px-4 py-3">Modelo</th>
            <th className="px-4 py-3 text-right">Ano</th>
            <th className="px-4 py-3">Dono</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {veiculos.map((veiculo) => (
            <tr key={veiculo.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <span className="plate">{veiculo.placa}</span>
              </td>
              <td className="px-4 py-3 text-slate-700">{veiculo.marca}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{veiculo.modelo}</td>
              <td className="px-4 py-3 text-right text-slate-700 tabular-nums">{veiculo.ano}</td>
              <td className="px-4 py-3 text-slate-700">{nomeDoDono(veiculo.dono)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Link
                    to={`/veiculos/${veiculo.id}`}
                    className="btn-ghost"
                    aria-label={`Editar ${veiculo.placa}`}
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="btn-ghost-danger"
                    aria-label={`Excluir ${veiculo.placa}`}
                    onClick={() => onRemove(veiculo)}
                  >
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
