import { useCallback, useEffect, useState } from 'react'
import { ApiError, getErrorMessage } from '../../../shared/api/client'
import { ordemServicoApi } from '../api/ordemServicoApi'
import type { Evento, EventoInput } from '../types'

const STATUS_HTTP_ENVIO_FALHOU = 502

function isEnvioFalho(e: unknown): boolean {
  return e instanceof ApiError && e.status === STATUS_HTTP_ENVIO_FALHOU
}

export function useEventos(ordemServicoId: string) {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setEventos(await ordemServicoApi.listEventos(ordemServicoId))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setIsLoading(false)
    }
  }, [ordemServicoId])

  useEffect(() => {
    void reload()
  }, [reload])

  async function add(input: EventoInput) {
    setIsSaving(true)
    setError(null)
    try {
      const evento = await ordemServicoApi.addEvento(ordemServicoId, input)
      setEventos((atual) => [...atual, evento])
      return true
    } catch (e) {
      // o evento é salvo mesmo quando o WhatsApp falha
      if (isEnvioFalho(e)) {
        await reload()
        setError(getErrorMessage(e))
        return true
      }
      setError(getErrorMessage(e))
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function reenviar(eventoId: string) {
    setIsSaving(true)
    setError(null)
    try {
      const atualizado = await ordemServicoApi.reenviarNotificacao(ordemServicoId, eventoId)
      setEventos((atual) => atual.map((evento) => (evento.id === eventoId ? atualizado : evento)))
      return true
    } catch (e) {
      if (isEnvioFalho(e)) await reload()
      setError(getErrorMessage(e))
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return { eventos, isLoading, isSaving, error, reload, add, reenviar }
}
