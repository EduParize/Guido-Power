import { createBrowserRouter } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { RequireAuth, RequireRole } from '../shared/auth'
import { HomePage } from '../pages/home/HomePage'
import { LoginPage } from '../pages/login/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { AppShell } from './AppShell'
import { RouteErrorPage } from './RouteErrorPage'

/*
 * Como adicionar rotas: substitua APENAS o conteúdo do seu bloco <slot:...>.
 * Paths são relativos à raiz (sem "/" inicial). Prefira `lazy` (não exige imports no topo do arquivo):
 *
 *   { path: 'clientes', lazy: async () => ({ Component: (await import('../pages/clientes/ClientesPage')).ClientesPage }) },
 *   { path: 'clientes/novo', lazy: async () => ({ Component: (await import('../pages/clientes/ClienteNovoPage')).ClienteNovoPage }) },
 */

// <slot:clientes>
const clientesRoutes: RouteObject[] = [
  { path: 'clientes', lazy: async () => ({ Component: (await import('../pages/clientes/ClientesPage')).ClientesPage }) },
  {
    path: 'clientes/novo',
    lazy: async () => ({ Component: (await import('../pages/clientes/ClienteNovoPage')).ClienteNovoPage }),
  },
  {
    path: 'clientes/:id',
    lazy: async () => ({ Component: (await import('../pages/clientes/ClienteDetalhePage')).ClienteDetalhePage }),
  },
]
// </slot:clientes>

// <slot:veiculos>
const veiculosRoutes: RouteObject[] = [
  { path: 'veiculos', lazy: async () => ({ Component: (await import('../pages/veiculos/VeiculosPage')).VeiculosPage }) },
  {
    path: 'veiculos/novo',
    lazy: async () => ({ Component: (await import('../pages/veiculos/VeiculoNovoPage')).VeiculoNovoPage }),
  },
  {
    path: 'veiculos/:id',
    lazy: async () => ({ Component: (await import('../pages/veiculos/VeiculoDetalhePage')).VeiculoDetalhePage }),
  },
]
// </slot:veiculos>

// <slot:ordens-servico>
const ordensServicoRoutes: RouteObject[] = [
  {
    path: 'ordens-servico',
    lazy: async () => ({ Component: (await import('../pages/ordens-servico/OrdensServicoPage')).OrdensServicoPage }),
  },
  {
    path: 'ordens-servico/nova',
    lazy: async () => ({ Component: (await import('../pages/ordens-servico/OrdemServicoNovaPage')).OrdemServicoNovaPage }),
  },
  {
    path: 'ordens-servico/:id',
    lazy: async () => ({ Component: (await import('../pages/ordens-servico/OrdemServicoDetalhePage')).OrdemServicoDetalhePage }),
  },
]
// </slot:ordens-servico>

// <slot:orcamentos>
const orcamentosRoutes: RouteObject[] = [
  {
    path: 'orcamentos',
    lazy: async () => ({ Component: (await import('../pages/orcamentos/OrcamentosPage')).OrcamentosPage }),
  },
  {
    path: 'orcamentos/novo',
    lazy: async () => ({ Component: (await import('../pages/orcamentos/OrcamentoNovoPage')).OrcamentoNovoPage }),
  },
  {
    path: 'orcamentos/:id',
    lazy: async () => ({ Component: (await import('../pages/orcamentos/OrcamentoDetalhePage')).OrcamentoDetalhePage }),
  },
]
// </slot:orcamentos>

// <slot:itens>
const itensRoutes: RouteObject[] = [
  {
    path: 'itens',
    lazy: async () => ({ Component: (await import('../pages/itens/ItensPage')).ItensPage }),
  },
]
// </slot:itens>

// Rotas exclusivas de administrador: já ficam dentro de <RequireRole role="admin">.
// <slot:usuarios>
const usuariosRoutes: RouteObject[] = [
  { path: 'usuarios', lazy: async () => ({ Component: (await import('../pages/usuarios/UsuariosPage')).UsuariosPage }) },
  { path: 'usuarios/novo', lazy: async () => ({ Component: (await import('../pages/usuarios/UsuarioFormPage')).UsuarioFormPage }) },
  { path: 'usuarios/:id', lazy: async () => ({ Component: (await import('../pages/usuarios/UsuarioFormPage')).UsuarioFormPage }) },
]
// </slot:usuarios>

// <slot:configuracoes>
const configuracoesRoutes: RouteObject[] = [
  {
    path: 'configuracoes',
    lazy: async () => ({ Component: (await import('../pages/configuracoes/ConfiguracoesPage')).ConfiguracoesPage }),
  },
]
// </slot:configuracoes>

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      ...ordensServicoRoutes,
      ...orcamentosRoutes,
      ...clientesRoutes,
      ...veiculosRoutes,
      ...itensRoutes,
      {
        element: <RequireRole role="admin" />,
        children: [...usuariosRoutes, ...configuracoesRoutes],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
