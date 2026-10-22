import { Link } from 'react-router-dom'
import { useClientes } from '../../features/cliente/hooks/useClientes'
import { OrdemServicoTable } from '../../features/ordem-servico/components/OrdemServicoTable'
import { useOrdensServico } from '../../features/ordem-servico/hooks/useOrdensServico'
import type { OrdemServico } from '../../features/ordem-servico/types'
import { useVeiculos } from '../../features/veiculo/hooks/useVeiculos'
import { Alert } from '../../shared/ui/Alert'
import { Icon } from '../../shared/ui/Icon'
import { PageHeader } from '../../shared/ui/PageHeader'

export function OrdensServicoPage() {
  const { ordens, isLoading, error, remove } = useOrdensServico()
  const { clientes } = useClientes()
  const { veiculos } = useVeiculos()

  async function handleRemove(ordem: OrdemServico) {
    if (window.confirm(`Excluir a ordem "${ordem.descricao}"?`)) {
      await remove(ordem.id)
    }
  }

  return (
    <div>
      <PageHeader
        title="Ordens de serviço"
        description="Acompanhe o andamento, a decisão e o orçamento de cada serviço."
        actions={
          <Link to="/ordens-servico/novo" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Nova ordem
          </Link>
        }
      />
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {isLoading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <OrdemServicoTable
          ordens={ordens}
          clientes={clientes}
          veiculos={veiculos}
          onRemove={handleRemove}
        />
      )}
    </div>
  )
}
