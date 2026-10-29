import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../shared/ui'
import { VeiculoForm } from './VeiculoForm'

export function VeiculoNovoPage() {
  const navigate = useNavigate()
  const clienteId = useSearchParams()[0].get('clienteId') ?? undefined
  // Vindo da página de um cliente, volta para ela; senão, para a lista.
  const back = clienteId ? `/clientes/${clienteId}` : '/veiculos'
  return (
    <>
      <PageHeader title="Novo veículo" description="Cadastre a placa e o dono do veículo." />
      <VeiculoForm clienteId={clienteId} cancelTo={back} onSaved={() => navigate(back)} />
    </>
  )
}
