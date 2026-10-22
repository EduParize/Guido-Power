import { Link } from 'react-router-dom'
import { ClienteTable } from '../../features/cliente/components/ClienteTable'
import { useClientes } from '../../features/cliente/hooks/useClientes'
import type { Cliente } from '../../features/cliente/types'
import { Alert } from '../../shared/ui/Alert'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Icon } from '../../shared/ui/Icon'
import { PageHeader } from '../../shared/ui/PageHeader'

export function ClientesPage() {
  const { clientes, isLoading, error, remove } = useClientes()

  function handleDelete(cliente: Cliente) {
    if (window.confirm(`Excluir o cliente ${cliente.nome}?`)) {
      void remove(cliente.id)
    }
  }

  return (
    <section>
      <PageHeader
        title="Clientes"
        description="Cadastre e acompanhe os clientes da oficina."
        actions={
          <Link to="/clientes/novo" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Novo cliente
          </Link>
        }
      />
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {isLoading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : clientes.length === 0 ? (
        <EmptyState
          title="Nenhum cliente cadastrado"
          description="Cadastre o primeiro cliente para abrir ordens de serviço."
          action={
            <Link to="/clientes/novo" className="btn-primary">
              Cadastrar cliente
            </Link>
          }
        />
      ) : (
        <ClienteTable clientes={clientes} onDelete={handleDelete} />
      )}
    </section>
  )
}
