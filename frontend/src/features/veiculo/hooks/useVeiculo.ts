import { useEffect, useState } from 'react'
import { getErrorMessage } from '../../../shared/api/client'
import { veiculoApi } from '../api/veiculoApi'
import type { Veiculo, VeiculoInput } from '../types'

export function useVeiculo(id?: string) {
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null)
  const [isLoading, setIsLoading] = useState(id !== undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id === undefined) return

    let isAtivo = true
    veiculoApi
      .getById(id)
      .then((dados) => {
        if (isAtivo) setVeiculo(dados)
      })
      .catch((e: unknown) => {
        if (isAtivo) setError(getErrorMessage(e))
      })
      .finally(() => {
        if (isAtivo) setIsLoading(false)
      })

    return () => {
      isAtivo = false
    }
  }, [id])

  async function save(input: VeiculoInput) {
    setIsSaving(true)
    setError(null)
    try {
      const salvo = id === undefined
        ? await veiculoApi.create(input)
        : await veiculoApi.update(id, input)
      setVeiculo(salvo)
      return salvo
    } catch (e) {
      setError(getErrorMessage(e))
      return null
    } finally {
      setIsSaving(false)
    }
  }

  return { veiculo, isLoading, isSaving, error, save }
}
