import { apiRequest } from '../../../shared/api/client'
import type { Cliente, ClienteInput } from '../types'

function list(): Promise<Cliente[]> {
  return apiRequest<Cliente[]>('/clientes')
}

function getById(id: string): Promise<Cliente> {
  return apiRequest<Cliente>(`/clientes/${id}`)
}

function create(input: ClienteInput): Promise<Cliente> {
  return apiRequest<Cliente>('/clientes', { method: 'POST', body: input })
}

function update(id: string, input: ClienteInput): Promise<Cliente> {
  return apiRequest<Cliente>(`/clientes/${id}`, { method: 'PUT', body: input })
}

function remove(id: string): Promise<void> {
  return apiRequest<void>(`/clientes/${id}`, { method: 'DELETE' })
}

export const clienteApi = { list, getById, create, update, delete: remove }
