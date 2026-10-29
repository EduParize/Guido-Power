import { ApiError, getErrorMessage } from '../../shared/api/http.ts'
import type { NotificationErrorBody, ResultadoEnvio } from '../../shared/api/types.ts'

export const RESULTADO_TEXTO: Record<ResultadoEnvio, string> = {
  REJEITADO: 'O WhatsApp recusou a mensagem. Confira o telefone do cliente e reenvie.',
  INCERTO: 'Não foi possível confirmar o envio; a mensagem pode ter chegado ao cliente. Confira antes de reenviar.',
}

function isNotificationBody(body: unknown): body is NotificationErrorBody {
  return typeof body === 'object' && body !== null && 'eventoId' in body && 'resultadoEnvio' in body
}

/** 502 com corpo de notificação = o evento foi salvo, mas a notificação por WhatsApp falhou. Outro 502 (proxy/gateway) não garante nada. */
export function describeEventoError(e: unknown): { message: string; saved: boolean } {
  if (e instanceof ApiError && e.status === 502 && isNotificationBody(e.body)) {
    return {
      message: `A alteração foi salva, mas a notificação por WhatsApp falhou. ${RESULTADO_TEXTO[e.body.resultadoEnvio] ?? 'Use "Reenviar notificação" no histórico.'}`,
      saved: true,
    }
  }
  return { message: getErrorMessage(e), saved: false }
}
