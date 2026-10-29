import { ApiError, apiRequest } from '../../../shared/api/client'
import type { Orcamento, OrcamentoInput } from '../types'

async function getByOrdemServicoId(ordemServicoId: string): Promise<Orcamento | null> {
  try {
    return await apiRequest<Orcamento>(`/ordens-servico/${ordemServicoId}/orcamento`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

function upsert(ordemServicoId: string, input: OrcamentoInput): Promise<Orcamento> {
  return apiRequest<Orcamento>(`/ordens-servico/${ordemServicoId}/orcamento`, {
    method: 'PUT',
    body: input,
  })
}

function remove(ordemServicoId: string): Promise<void> {
  return apiRequest<void>(`/ordens-servico/${ordemServicoId}/orcamento`, {
    method: 'DELETE',
  })
}

export const orcamentoApi = {
  getByOrdemServicoId,
  upsert,
  remove,
}
