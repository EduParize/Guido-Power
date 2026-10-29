import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { LinkButton } from '../shared/ui'
import { EmptyState } from '../shared/ui'

export function RouteErrorPage() {
  const error = useRouteError()
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Erro desconhecido'
  return (
    <div className="mx-auto grid min-h-dvh place-items-center bg-canvas px-4">
      <EmptyState
        icon="alert"
        title="Algo deu errado nesta tela"
        description={`${detail}. Volte ao painel e tente novamente.`}
        action={<LinkButton to="/" reloadDocument>Voltar ao painel</LinkButton>}
      />
    </div>
  )
}
