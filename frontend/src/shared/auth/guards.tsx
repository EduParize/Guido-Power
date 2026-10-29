import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { EmptyState } from '../ui/EmptyState'
import { LinkButton } from '../ui/Button'
import { useAuth } from './AuthContext'
import type { Role } from './roles'

/** Layout-route guard: sem sessão, vai para /login guardando o destino em `state.from`. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    const from = location.pathname + location.search
    return <Navigate to="/login" replace state={{ from }} />
  }
  return children ?? <Outlet />
}

/** Restringe a rota a um papel; os demais veem "Acesso restrito". Pode envolver `element` ou ser layout-route. */
export function RequireRole({ role, children }: { role: Role; children?: ReactNode }) {
  const { role: current } = useAuth()
  if (current !== role) {
    return (
      <EmptyState
        icon="lock"
        title="Acesso restrito"
        description="Esta área é exclusiva para administradores. Peça a um administrador para fazer a alteração ou voltar ao painel."
        action={<LinkButton to="/" variant="secondary">Voltar ao painel</LinkButton>}
        className="py-24"
      />
    )
  }
  return children ?? <Outlet />
}
