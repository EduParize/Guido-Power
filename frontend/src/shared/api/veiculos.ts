import { apiRequest } from './http.ts'
import type { Id, Veiculo, VeiculoFromOrcamentoInput, VeiculoInput, VeiculoListQuery } from './types.ts'

export const veiculosApi = {
  list: (query: VeiculoListQuery = {}, signal?: AbortSignal) => {
    const qs = query.clienteId ? `?clienteId=${encodeURIComponent(query.clienteId)}` : ''
    return apiRequest<Veiculo[]>(`/veiculos${qs}`, { signal })
  },
  get: (id: Id, signal?: AbortSignal) => apiRequest<Veiculo>(`/veiculos/${encodeURIComponent(id)}`, { signal }),
  create: (input: VeiculoInput) => apiRequest<Veiculo>('/veiculos', { method: 'POST', body: input }),
  // a placa vem do orçamento (que precisa tê-la).
  createFromOrcamento: (input: VeiculoFromOrcamentoInput) =>
    apiRequest<Veiculo>('/veiculos', { method: 'POST', body: input }),
  update: (id: Id, input: VeiculoInput) =>
    apiRequest<Veiculo>(`/veiculos/${encodeURIComponent(id)}`, { method: 'PUT', body: input }),
  remove: (id: Id) => apiRequest<void>(`/veiculos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
