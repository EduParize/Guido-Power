import { NavLink, Outlet } from 'react-router-dom'
import { Icon } from '../shared/ui/Icon'
import type { IconName } from '../shared/ui/Icon'

interface NavItem {
  to: string
  label: string
  icon: IconName
  end?: boolean
}

const LINKS: NavItem[] = [
  { to: '/', label: 'Início', icon: 'dashboard', end: true },
  { to: '/ordens-servico', label: 'Ordens de serviço', icon: 'ordem' },
  { to: '/clientes', label: 'Clientes', icon: 'cliente' },
  { to: '/veiculos', label: 'Veículos', icon: 'veiculo' },
  { to: '/usuarios', label: 'Usuários', icon: 'usuario' },
]

function linkClass({ isActive }: { isActive: boolean }) {
  const base =
    'relative flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none'
  return `${base} ${
    isActive ? 'bg-brand-800 text-white' : 'text-brand-100 hover:bg-brand-800/60 hover:text-white'
  }`
}

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 lg:pl-64">
      <aside className="bg-brand-900 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex items-center gap-3 px-4 pt-3 lg:justify-center lg:px-6 lg:pt-6 lg:pb-2">
          <span className="overflow-hidden rounded-md bg-black lg:rounded-xl">
            <img
              src="/logo.png"
              alt="Guido Power — Oficina Mecânica"
              className="h-9 w-auto lg:h-auto lg:w-40"
            />
          </span>
          <span className="text-lg font-bold tracking-tight text-white lg:hidden">Guido Power</span>
        </div>
        <nav
          aria-label="Principal"
          className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible lg:px-4 lg:py-2"
        >
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-white lg:inset-x-auto lg:top-2 lg:bottom-2 lg:left-0 lg:h-auto lg:w-1"
                    />
                  )}
                  <Icon name={link.icon} />
                  {link.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}
