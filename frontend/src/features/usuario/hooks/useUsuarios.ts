import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../../../shared/api/client'
import { usuarioApi } from '../api/usuarioApi'
import type { Usuario } from '../types'

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setUsuarios(await usuarioApi.list())
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
      await usuarioApi.delete(id)
      setUsuarios((atual) => atual.filter((usuario) => usuario.id !== id))
      return true
    } catch (e) {
      setError(getErrorMessage(e))
      return false
    }
  }

  return { usuarios, isLoading, error, reload, remove }
}
