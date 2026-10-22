import { apiRequest } from '../../../shared/api/client'
import type { Veiculo, VeiculoInput } from '../types'

function list(clienteId?: string): Promise<Veiculo[]> {
  if (!clienteId) return apiRequest<Veiculo[]>('/veiculos')
  return apiRequest<Veiculo[]>(`/veiculos?clienteId=${encodeURIComponent(clienteId)}`)
}

function getById(id: string): Promise<Veiculo> {
  return apiRequest<Veiculo>(`/veiculos/${id}`)
}

function create(input: VeiculoInput): Promise<Veiculo> {
  return apiRequest<Veiculo>('/veiculos', { method: 'POST', body: input })
}

function update(id: string, input: VeiculoInput): Promise<Veiculo> {
  return apiRequest<Veiculo>(`/veiculos/${id}`, { method: 'PUT', body: input })
}

function remove(id: string): Promise<void> {
  return apiRequest<void>(`/veiculos/${id}`, { method: 'DELETE' })
}

export const veiculoApi = { list, getById, create, update, delete: remove }
