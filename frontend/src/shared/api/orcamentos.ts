import { apiRequest } from './http.ts'
import type { Id, Orcamento, OrcamentoCreateInput, OrcamentoInput } from './types.ts'

export const orcamentosApi = {
  list: (signal?: AbortSignal) => apiRequest<Orcamento[]>('/orcamentos', { signal }),
  get: (id: Id, signal?: AbortSignal) => apiRequest<Orcamento>(`/orcamentos/${encodeURIComponent(id)}`, { signal }),
  create: (input: OrcamentoCreateInput) => apiRequest<Orcamento>('/orcamentos', { method: 'POST', body: input }),
  update: (id: Id, input: OrcamentoInput) =>
    apiRequest<Orcamento>(`/orcamentos/${encodeURIComponent(id)}`, { method: 'PUT', body: input }),
  remove: (id: Id) => apiRequest<void>(`/orcamentos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
