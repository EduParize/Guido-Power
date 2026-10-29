import { apiRequest } from './http.ts'
import type {
  Id,
  OrdemServico,
  OrdemServicoCreateInput,
  OrdemServicoUpdateInput,
} from './types.ts'

export const ordensServicoApi = {
  list: (signal?: AbortSignal) => apiRequest<OrdemServico[]>('/ordens-servico', { signal }),
  get: (id: Id, signal?: AbortSignal) =>
    apiRequest<OrdemServico>(`/ordens-servico/${encodeURIComponent(id)}`, { signal }),
  create: (input: OrdemServicoCreateInput) =>
    apiRequest<OrdemServico>('/ordens-servico', { method: 'POST', body: input }),
  // Envia exatamente os 4 campos aceitos: status/motivo geram 400 no backend.
  update: (id: Id, input: OrdemServicoUpdateInput) => {
    const { veiculoId, clienteId, orcamentoId, descricao } = input
    return apiRequest<OrdemServico>(`/ordens-servico/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: { veiculoId, clienteId, orcamentoId, descricao },
    })
  },
  remove: (id: Id) => apiRequest<void>(`/ordens-servico/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
