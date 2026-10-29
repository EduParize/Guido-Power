import { apiRequest } from './http.ts'
import type { Id, Usuario, UsuarioInput, UsuarioUpdate } from './types.ts'

export const usuariosApi = {
  list: (signal?: AbortSignal) => apiRequest<Usuario[]>('/usuarios', { signal }),
  get: (id: Id, signal?: AbortSignal) => apiRequest<Usuario>(`/usuarios/${encodeURIComponent(id)}`, { signal }),
  create: (input: UsuarioInput) => apiRequest<Usuario>('/usuarios', { method: 'POST', body: input }),
  update: (id: Id, input: UsuarioUpdate) =>
    apiRequest<Usuario>(`/usuarios/${encodeURIComponent(id)}`, { method: 'PUT', body: input }),
  remove: (id: Id) => apiRequest<void>(`/usuarios/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
