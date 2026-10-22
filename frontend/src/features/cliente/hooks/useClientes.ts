import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../../../shared/api/client'
import { clienteApi } from '../api/clienteApi'
import type { Cliente } from '../types'

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setClientes(await clienteApi.list())
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
      await clienteApi.delete(id)
      setClientes((atual) => atual.filter((cliente) => cliente.id !== id))
      return true
    } catch (e) {
      setError(getErrorMessage(e))
      return false
    }
  }

  return { clientes, isLoading, error, reload, remove }
}
