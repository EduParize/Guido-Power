import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../../../shared/api/client'
import { ordemServicoApi } from '../api/ordemServicoApi'
import type { OrdemServico, OrdemServicoCreateInput, OrdemServicoInput } from '../types'

export function useOrdemServico(id?: string) {
  const [ordem, setOrdem] = useState<OrdemServico | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!id) return
    setError(null)
    try {
      setOrdem(await ordemServicoApi.getById(id))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void reload()
  }, [reload])

  async function persist(action: () => Promise<OrdemServico>) {
    setIsSaving(true)
    setError(null)
    try {
      const salva = await action()
      setOrdem(salva)
      return salva
    } catch (e) {
      setError(getErrorMessage(e))
      return null
    } finally {
      setIsSaving(false)
    }
  }

  function create(input: OrdemServicoCreateInput) {
    return persist(() => ordemServicoApi.create(input))
  }

  async function update(input: OrdemServicoInput) {
    if (!id) return null
    return persist(() => ordemServicoApi.update(id, input))
  }

  return { ordem, isLoading, isSaving, error, create, update, reload }
}
