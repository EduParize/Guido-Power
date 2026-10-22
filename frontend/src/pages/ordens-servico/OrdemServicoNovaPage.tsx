import { useNavigate } from 'react-router-dom'
import { useClientes } from '../../features/cliente/hooks/useClientes'
import { OrdemServicoForm } from '../../features/ordem-servico/components/OrdemServicoForm'
import { useOrdemServico } from '../../features/ordem-servico/hooks/useOrdemServico'
import type { OrdemServicoCreateInput } from '../../features/ordem-servico/types'
import { useVeiculos } from '../../features/veiculo/hooks/useVeiculos'
import { Alert } from '../../shared/ui/Alert'
import { PageHeader } from '../../shared/ui/PageHeader'

export function OrdemServicoNovaPage() {
  const navigate = useNavigate()
  const { isSaving, error, create } = useOrdemServico()
  const { clientes } = useClientes()
  const { veiculos } = useVeiculos()

  async function handleSubmit(input: OrdemServicoCreateInput) {
    const ordem = await create(input)
    if (ordem) navigate(`/ordens-servico/${ordem.id}`)
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Nova ordem de serviço"
        description="Informe o cliente, o veículo e o serviço a ser executado."
      />
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      <OrdemServicoForm
        modo="criar"
        clientes={clientes}
        veiculos={veiculos}
        isSaving={isSaving}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
