import { Link } from 'react-router-dom'
import type { Cliente } from '../types'

interface ClienteTableProps {
  clientes: Cliente[]
  onDelete: (cliente: Cliente) => void
}

export function ClienteTable({ clientes, onDelete }: ClienteTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="table-head">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Documento</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">Telefone</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {clientes.map((cliente) => (
            <tr key={cliente.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-900">{cliente.nome}</td>
              <td className="px-4 py-3 text-slate-600 tabular-nums">{cliente.documento}</td>
              <td className="px-4 py-3 text-slate-600">{cliente.email}</td>
              <td className="px-4 py-3 text-slate-600 tabular-nums">{cliente.telefone}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Link
                    to={`/clientes/${cliente.id}`}
                    className="btn-ghost"
                    aria-label={`Editar ${cliente.nome}`}
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="btn-ghost-danger"
                    aria-label={`Excluir ${cliente.nome}`}
                    onClick={() => onDelete(cliente)}
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
