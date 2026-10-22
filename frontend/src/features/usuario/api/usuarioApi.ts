import { apiRequest } from '../../../shared/api/client'
import type { Usuario, UsuarioInput, UsuarioUpdate } from '../types'

function list(): Promise<Usuario[]> {
  return apiRequest<Usuario[]>('/usuarios')
}

function getById(id: string): Promise<Usuario> {
  return apiRequest<Usuario>(`/usuarios/${id}`)
}

function create(input: UsuarioInput): Promise<Usuario> {
  return apiRequest<Usuario>('/usuarios', { method: 'POST', body: input })
}

function update(id: string, input: UsuarioUpdate): Promise<Usuario> {
  return apiRequest<Usuario>(`/usuarios/${id}`, { method: 'PUT', body: input })
}

function remove(id: string): Promise<void> {
  return apiRequest<void>(`/usuarios/${id}`, { method: 'DELETE' })
}

export const usuarioApi = { list, getById, create, update, delete: remove }
