import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ClienteFormPage } from '../pages/clientes/ClienteFormPage'
import { ClientesPage } from '../pages/clientes/ClientesPage'
import { HomePage } from '../pages/home/HomePage'
import { OrdemServicoDetalhePage } from '../pages/ordens-servico/OrdemServicoDetalhePage'
import { OrdemServicoNovaPage } from '../pages/ordens-servico/OrdemServicoNovaPage'
import { OrdensServicoPage } from '../pages/ordens-servico/OrdensServicoPage'
import { UsuarioFormPage } from '../pages/usuarios/UsuarioFormPage'
import { UsuariosPage } from '../pages/usuarios/UsuariosPage'
import { VeiculoFormPage } from '../pages/veiculos/VeiculoFormPage'
import { VeiculosPage } from '../pages/veiculos/VeiculosPage'
import { AppLayout } from './AppLayout'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/usuarios/novo" element={<UsuarioFormPage />} />
          <Route path="/usuarios/:id" element={<UsuarioFormPage />} />

          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/clientes/novo" element={<ClienteFormPage />} />
          <Route path="/clientes/:id" element={<ClienteFormPage />} />

          <Route path="/veiculos" element={<VeiculosPage />} />
          <Route path="/veiculos/novo" element={<VeiculoFormPage />} />
          <Route path="/veiculos/:id" element={<VeiculoFormPage />} />

          <Route path="/ordens-servico" element={<OrdensServicoPage />} />
          <Route path="/ordens-servico/novo" element={<OrdemServicoNovaPage />} />
          <Route path="/ordens-servico/:id" element={<OrdemServicoDetalhePage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
