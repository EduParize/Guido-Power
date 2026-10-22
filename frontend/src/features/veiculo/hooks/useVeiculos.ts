import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../../../shared/api/client'
import { veiculoApi } from '../api/veiculoApi'
import type { Veiculo } from '../types'

export function useVeiculos(clienteId?: string) {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setVeiculos(await veiculoApi.list(clienteId))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setIsLoading(false)
    }
  }, [clienteId])

  useEffect(() => {
    void reload()
  }, [reload])

  async function remove(id: string) {
    try {
      await veiculoApi.delete(id)
      setVeiculos((atual) => atual.filter((veiculo) => veiculo.id !== id))
      return true
    } catch (e) {
      setError(getErrorMessage(e))
      return false
    }
  }

  return { veiculos, isLoading, error, reload, remove }
}
