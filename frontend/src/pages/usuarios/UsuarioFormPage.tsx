import { useNavigate, useParams } from 'react-router-dom'
import { UsuarioForm } from '../../features/usuario/components/UsuarioForm'
import { useUsuario } from '../../features/usuario/hooks/useUsuario'
import type { UsuarioUpdate } from '../../features/usuario/types'
import { Alert } from '../../shared/ui/Alert'
import { Card } from '../../shared/ui/Card'
import { PageHeader } from '../../shared/ui/PageHeader'

export function UsuarioFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario, isLoading, isSaving, error, save } = useUsuario(id)

  async function handleSubmit(input: UsuarioUpdate) {
    const salvo = await save(input)
    if (salvo) navigate('/usuarios')
  }

  return (
    <section className="max-w-2xl">
      <PageHeader
        title={id ? 'Editar usuário' : 'Novo usuário'}
        description={id ? 'Atualize os dados de acesso do usuário.' : 'Preencha os dados para cadastrar o usuário.'}
      />
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {isLoading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        (!id || usuario) && (
          <Card>
            <UsuarioForm
              key={usuario?.id ?? 'novo'}
              usuario={usuario}
              isSaving={isSaving}
              onSubmit={handleSubmit}
            />
          </Card>
        )
      )}
    </section>
  )
}
