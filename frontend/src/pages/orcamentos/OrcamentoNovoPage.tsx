import { PageHeader } from '../../shared/ui'
import { OrcamentoForm } from './OrcamentoForm'

export function OrcamentoNovoPage() {
  return (
    <>
      <PageHeader
        title="Novo orçamento"
        description="Registre o contato e some peças e mão de obra; o total é calculado a partir dos itens."
      />
      <OrcamentoForm />
    </>
  )
}
