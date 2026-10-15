import { apiRequest } from './client'

export interface HealthResponse {
  status: 'ok'
}

export function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health')
}
