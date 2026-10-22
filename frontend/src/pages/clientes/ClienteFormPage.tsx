import { useNavigate, useParams } from 'react-router-dom'
import { ClienteForm } from '../../features/cliente/components/ClienteForm'
import { useCliente } from '../../features/cliente/hooks/useCliente'
import type { ClienteInput } from '../../features/cliente/types'
import { Alert } from '../../shared/ui/Alert'
import { Card } from '../../shared/ui/Card'
import { PageHeader } from '../../shared/ui/PageHeader'

export function ClienteFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cliente, isLoading, isSaving, error, save } = useCliente(id)

  async function handleSubmit(input: ClienteInput) {
    const salvo = await save(input)
    if (salvo) navigate('/clientes')
  }

  return (
    <section className="max-w-2xl">
      <PageHeader
        title={id ? 'Editar cliente' : 'Novo cliente'}
        description={id ? 'Atualize os dados do cliente.' : 'Preencha os dados para cadastrar o cliente.'}
      />
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {isLoading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        (!id || cliente) && (
          <Card>
            <ClienteForm
              key={cliente?.id ?? 'novo'}
              cliente={cliente}
              isSaving={isSaving}
              onSubmit={handleSubmit}
            />
          </Card>
        )
      )}
    </section>
  )
}
