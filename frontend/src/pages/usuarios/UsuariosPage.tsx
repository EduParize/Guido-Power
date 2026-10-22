import { Link } from 'react-router-dom'
import { UsuarioTable } from '../../features/usuario/components/UsuarioTable'
import { useUsuarios } from '../../features/usuario/hooks/useUsuarios'
import type { Usuario } from '../../features/usuario/types'
import { Alert } from '../../shared/ui/Alert'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Icon } from '../../shared/ui/Icon'
import { PageHeader } from '../../shared/ui/PageHeader'

export function UsuariosPage() {
  const { usuarios, isLoading, error, remove } = useUsuarios()

  function handleDelete(usuario: Usuario) {
    if (window.confirm(`Excluir o usuário ${usuario.nome}?`)) {
      void remove(usuario.id)
    }
  }

  return (
    <section>
      <PageHeader
        title="Usuários"
        description="Gerencie quem tem acesso ao sistema da oficina."
        actions={
          <Link to="/usuarios/novo" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Novo usuário
          </Link>
        }
      />
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {isLoading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : usuarios.length === 0 ? (
        <EmptyState
          title="Nenhum usuário cadastrado"
          description="Cadastre usuários para dar acesso ao sistema."
          action={
            <Link to="/usuarios/novo" className="btn-primary">
              Cadastrar usuário
            </Link>
          }
        />
      ) : (
        <UsuarioTable usuarios={usuarios} onDelete={handleDelete} />
      )}
    </section>
  )
}
