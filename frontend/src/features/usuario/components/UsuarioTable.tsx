import { Link } from 'react-router-dom'
import type { Usuario } from '../types'

interface UsuarioTableProps {
  usuarios: Usuario[]
  onDelete: (usuario: Usuario) => void
}

export function UsuarioTable({ usuarios, onDelete }: UsuarioTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="table-head">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {usuarios.map((usuario) => (
            <tr key={usuario.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-900">{usuario.nome}</td>
              <td className="px-4 py-3 text-slate-600">{usuario.email}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Link
                    to={`/usuarios/${usuario.id}`}
                    className="btn-ghost"
                    aria-label={`Editar ${usuario.nome}`}
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="btn-ghost-danger"
                    aria-label={`Excluir ${usuario.nome}`}
                    onClick={() => onDelete(usuario)}
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
