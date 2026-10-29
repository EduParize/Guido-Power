import { apiRequest } from './http.ts'
import type { Evento, EventoCreateInput, EventoUpdateInput, Id } from './types.ts'

const base = (osId: Id) => `/ordens-servico/${encodeURIComponent(osId)}/eventos`
const one = (osId: Id, eventoId: Id) => `${base(osId)}/${encodeURIComponent(eventoId)}`

// POST/PUT/resend podem responder 502 (NotificationErrorBody) com o evento JÁ salvo:
// capture ApiError com status 502 e refaça o fetch da OS.
export const eventosApi = {
  list: (osId: Id, signal?: AbortSignal) => apiRequest<Evento[]>(base(osId), { signal }),
  get: (osId: Id, eventoId: Id, signal?: AbortSignal) => apiRequest<Evento>(one(osId, eventoId), { signal }),
  create: (osId: Id, input: EventoCreateInput) => apiRequest<Evento>(base(osId), { method: 'POST', body: input }),
  update: (osId: Id, eventoId: Id, input: EventoUpdateInput) =>
    apiRequest<Evento>(one(osId, eventoId), { method: 'PUT', body: input }),
  remove: (osId: Id, eventoId: Id) => apiRequest<void>(one(osId, eventoId), { method: 'DELETE' }),
  resend: (osId: Id, eventoId: Id) =>
    apiRequest<Evento>(`${one(osId, eventoId)}/notificacao`, { method: 'POST' }),
}
