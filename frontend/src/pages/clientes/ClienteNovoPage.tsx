import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../shared/ui'
import { ClienteForm } from './ClienteForm'

export function ClienteNovoPage() {
  const navigate = useNavigate()
  return (
    <>
      <PageHeader title="Novo cliente" description="Cadastre os dados de contato. Depois você poderá adicionar os veículos." />
      <ClienteForm cancelTo="/clientes" onSaved={(c) => navigate(`/clientes/${c.id}`)} />
    </>
  )
}
