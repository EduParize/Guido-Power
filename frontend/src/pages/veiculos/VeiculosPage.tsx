import { Link, useSearchParams } from 'react-router-dom'
import { useClientes } from '../../features/cliente/hooks/useClientes'
import { VeiculoTable } from '../../features/veiculo/components/VeiculoTable'
import { useVeiculos } from '../../features/veiculo/hooks/useVeiculos'
import type { Veiculo } from '../../features/veiculo/types'
import { Alert } from '../../shared/ui/Alert'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Icon } from '../../shared/ui/Icon'
import { PageHeader } from '../../shared/ui/PageHeader'

export function VeiculosPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const clienteId = searchParams.get('clienteId') ?? undefined
  const { veiculos, isLoading, error, remove } = useVeiculos(clienteId)
  const { clientes, error: erroClientes } = useClientes()
  const erro = error ?? erroClientes

  function handleFiltroChange(valor: string) {
    setSearchParams(valor ? { clienteId: valor } : {})
  }

  async function handleRemove(veiculo: Veiculo) {
    if (!window.confirm(`Excluir o veículo ${veiculo.placa}?`)) return
    await remove(veiculo.id)
  }

  return (
    <section>
      <PageHeader
        title="Veículos"
        description="Consulte os veículos atendidos e seus proprietários."
        actions={
          <Link to="/veiculos/novo" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Novo veículo
          </Link>
        }
      />

      <div className="mb-4 max-w-xs">
        <label className="field-label">
          Filtrar por cliente
          <select
            className="input mt-1"
            value={clienteId ?? ''}
            onChange={(event) => handleFiltroChange(event.target.value)}
          >
            <option value="">Todos os clientes</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {erro && <Alert variant="error" className="mb-4">{erro}</Alert>}
      {isLoading && <p className="text-sm text-slate-500">Carregando...</p>}
      {!isLoading && veiculos.length === 0 && (
        <EmptyState
          title="Nenhum veículo encontrado"
          description="Cadastre um veículo para vinculá-lo a um cliente."
          action={
            <Link to="/veiculos/novo" className="btn-primary">
              Cadastrar veículo
            </Link>
          }
        />
      )}
      {!isLoading && veiculos.length > 0 && (
        <VeiculoTable veiculos={veiculos} clientes={clientes} onRemove={handleRemove} />
      )}
    </section>
  )
}
