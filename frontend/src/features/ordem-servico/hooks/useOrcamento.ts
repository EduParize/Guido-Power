import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../../../shared/api/client'
import { orcamentoApi } from '../api/orcamentoApi'
import type { Orcamento, OrcamentoInput } from '../types'

export function useOrcamento(ordemServicoId: string) {
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(ordemServicoId))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!ordemServicoId) return
    setError(null)
    setIsLoading(true)
    try {
      setOrcamento(await orcamentoApi.getByOrdemServicoId(ordemServicoId))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setIsLoading(false)
    }
  }, [ordemServicoId])

  useEffect(() => {
    void reload()
  }, [reload])

  async function save(input: OrcamentoInput) {
    setIsSaving(true)
    setError(null)
    try {
      const salvo = await orcamentoApi.upsert(ordemServicoId, input)
      setOrcamento(salvo)
      return salvo
    } catch (e) {
      setError(getErrorMessage(e))
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function remove() {
    setIsSaving(true)
    setError(null)
    try {
      await orcamentoApi.remove(ordemServicoId)
      setOrcamento(null)
      return true
    } catch (e) {
      setError(getErrorMessage(e))
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return { orcamento, isLoading, isSaving, error, save, remove, reload }
}
