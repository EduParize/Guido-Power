import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../../../shared/api/client'
import { ordemServicoApi } from '../api/ordemServicoApi'
import type { OrdemServico } from '../types'

export function useOrdensServico() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setOrdens(await ordemServicoApi.list())
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  async function remove(id: string) {
    try {
      await ordemServicoApi.delete(id)
      setOrdens((atual) => atual.filter((ordem) => ordem.id !== id))
      return true
    } catch (e) {
      setError(getErrorMessage(e))
      return false
    }
  }

  return { ordens, isLoading, error, reload, remove }
}
