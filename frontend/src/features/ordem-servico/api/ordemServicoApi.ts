import { apiRequest } from '../../../shared/api/client'
import type {
  Evento,
  EventoInput,
  OrdemServico,
  OrdemServicoCreateInput,
  OrdemServicoInput,
} from '../types'

function list(): Promise<OrdemServico[]> {
  return apiRequest<OrdemServico[]>('/ordens-servico')
}

function getById(id: string): Promise<OrdemServico> {
  return apiRequest<OrdemServico>(`/ordens-servico/${id}`)
}

function create(input: OrdemServicoCreateInput): Promise<OrdemServico> {
  return apiRequest<OrdemServico>('/ordens-servico', { method: 'POST', body: input })
}

function update(id: string, input: OrdemServicoInput): Promise<OrdemServico> {
  return apiRequest<OrdemServico>(`/ordens-servico/${id}`, { method: 'PUT', body: input })
}

function remove(id: string): Promise<void> {
  return apiRequest<void>(`/ordens-servico/${id}`, { method: 'DELETE' })
}

function listEventos(ordemServicoId: string): Promise<Evento[]> {
  return apiRequest<Evento[]>(`/ordens-servico/${ordemServicoId}/eventos`)
}

function addEvento(ordemServicoId: string, input: EventoInput): Promise<Evento> {
  return apiRequest<Evento>(`/ordens-servico/${ordemServicoId}/eventos`, {
    method: 'POST',
    body: input,
  })
}

function reenviarNotificacao(ordemServicoId: string, eventoId: string): Promise<Evento> {
  return apiRequest<Evento>(`/ordens-servico/${ordemServicoId}/eventos/${eventoId}/notificacao`, {
    method: 'POST',
  })
}

export const ordemServicoApi = {
  list,
  getById,
  create,
  update,
  delete: remove,
  listEventos,
  addEvento,
  reenviarNotificacao,
}
