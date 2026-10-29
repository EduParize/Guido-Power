import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../shared/auth'
import { Badge, Icon, IconButton, cn } from '../shared/ui'
import type { IconName } from '../shared/ui'
import { ThemeSwitcher } from './ThemeSwitcher'

interface NavItem {
  to: string
  label: string
  icon: IconName
  end?: boolean
}

interface NavGroup {
  label: string
  adminOnly?: boolean
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    label: 'Operação',
    items: [
      { to: '/', label: 'Painel', icon: 'dashboard', end: true },
      { to: '/ordens-servico', label: 'Ordens de Serviço', icon: 'ordem' },
      { to: '/orcamentos', label: 'Orçamentos', icon: 'orcamento' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { to: '/clientes', label: 'Clientes', icon: 'cliente' },
      { to: '/veiculos', label: 'Veículos', icon: 'veiculo' },
      { to: '/itens', label: 'Itens e Peças', icon: 'item' },
    ],
  },
  {
    label: 'Administração',
    adminOnly: true,
    items: [
      { to: '/usuarios', label: 'Usuários', icon: 'usuario' },
      { to: '/configuracoes', label: 'Configurações', icon: 'config' },
    ],
  },
]

export interface SidebarProps {
  /** Chamado ao navegar/sair (fecha o drawer no mobile). */
  onNavigate?: () => void
  /** Botão de fechar, exibido só no drawer. */
  onClose?: () => void
}

export function Sidebar({ onNavigate, onClose }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="side-scope flex h-full flex-col bg-side-bg text-side-text">
      <div className="checker shrink-0" aria-hidden="true" />
      <div className="flex shrink-0 items-start justify-between gap-2 px-4 pt-3">
        <img src="/logo.png" alt="Guido Power" className="logo-blend h-auto w-40" />
        {onClose ? (
          <IconButton aria-label="Fechar menu" icon="close" onClick={onClose} className="text-side-text hover:bg-side-hover lg:hidden" />
        ) : null}
      </div>

      <nav aria-label="Navegação principal" className="mt-2 flex-1 overflow-y-auto px-3 pb-4">
        {NAV.filter((g) => !g.adminOnly || isAdmin).map((group) => (
          <div key={group.label} className="mt-5 first:mt-2">
            <p className="px-3 pb-1.5 text-sm font-semibold text-side-muted">{group.label}</p>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex h-11 items-center gap-3 rounded-lg px-3 text-base font-semibold no-underline transition-colors',
                        isActive
                          ? 'bg-side-active-bg text-side-active-fg'
                          : 'text-side-text hover:bg-side-hover',
                      )
                    }
                  >
                    <Icon name={item.icon} size={20} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex shrink-0 flex-col gap-3 border-t border-side-border p-4">
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold" title={user.email}>{user.nome}</p>
              <p className="truncate text-sm text-side-muted">{user.email}</p>
            </div>
            <Badge tone={isAdmin ? 'info' : 'neutral'}>{isAdmin ? 'Admin' : 'Atendente'}</Badge>
          </div>
        ) : null}
        <ThemeSwitcher />
        <button
          type="button"
          onClick={onLogout}
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-side-border text-base font-semibold text-side-text transition-colors hover:bg-side-hover"
        >
          <Icon name="logout" size={18} />
          Sair
        </button>
      </div>
    </div>
  )
}
