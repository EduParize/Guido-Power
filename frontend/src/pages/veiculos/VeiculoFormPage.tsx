import { useNavigate, useParams } from 'react-router-dom'
import { useClientes } from '../../features/cliente/hooks/useClientes'
import { VeiculoForm } from '../../features/veiculo/components/VeiculoForm'
import { useVeiculo } from '../../features/veiculo/hooks/useVeiculo'
import type { VeiculoInput } from '../../features/veiculo/types'
import { Alert } from '../../shared/ui/Alert'
import { Card } from '../../shared/ui/Card'
import { PageHeader } from '../../shared/ui/PageHeader'

export function VeiculoFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { veiculo, isLoading, isSaving, error, save } = useVeiculo(id)
  const { clientes, isLoading: isLoadingClientes, error: erroClientes } = useClientes()
  const erro = error ?? erroClientes
  const carregando = isLoading || isLoadingClientes
  const isFormularioPronto = !carregando && (id === undefined || veiculo !== null)

  async function handleSubmit(input: VeiculoInput) {
    const salvo = await save(input)
    if (salvo) navigate('/veiculos')
  }

  return (
    <section className="max-w-2xl">
      <PageHeader
        title={id === undefined ? 'Novo veículo' : 'Editar veículo'}
        description={
          id === undefined
            ? 'Preencha os dados para cadastrar o veículo.'
            : 'Atualize os dados do veículo.'
        }
      />

      {erro && <Alert variant="error" className="mb-4">{erro}</Alert>}
      {carregando && <p className="text-sm text-slate-500">Carregando...</p>}
      {isFormularioPronto && (
        <Card>
          <VeiculoForm
            key={veiculo?.id ?? 'novo'}
            veiculo={veiculo}
            clientes={clientes}
            isSaving={isSaving}
            onSubmit={handleSubmit}
          />
        </Card>
      )}
    </section>
  )
}
