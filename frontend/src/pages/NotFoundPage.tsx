import { EmptyState, LinkButton } from '../shared/ui'

export function NotFoundPage() {
  return (
    <EmptyState
      icon="search"
      title="Página não encontrada"
      description="O endereço não existe ou foi movido. Volte ao painel para continuar."
      action={<LinkButton to="/">Ir para o painel</LinkButton>}
      className="py-24"
    />
  )
}
