import { apiRequest } from './http.ts'
import type { Cliente, ClienteFromOrcamentoInput, ClienteInput, Id } from './types.ts'

export const clientesApi = {
  list: (signal?: AbortSignal) => apiRequest<Cliente[]>('/clientes', { signal }),
  get: (id: Id, signal?: AbortSignal) => apiRequest<Cliente>(`/clientes/${encodeURIComponent(id)}`, { signal }),
  create: (input: ClienteInput) => apiRequest<Cliente>('/clientes', { method: 'POST', body: input }),
  // nome e telefone vêm do orçamento (que precisa tê-los).
  createFromOrcamento: (input: ClienteFromOrcamentoInput) =>
    apiRequest<Cliente>('/clientes', { method: 'POST', body: input }),
  update: (id: Id, input: ClienteInput) =>
    apiRequest<Cliente>(`/clientes/${encodeURIComponent(id)}`, { method: 'PUT', body: input }),
  remove: (id: Id) => apiRequest<void>(`/clientes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
