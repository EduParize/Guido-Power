import { useEffect, useState } from 'react'
import { getErrorMessage } from '../../../shared/api/client'
import { clienteApi } from '../api/clienteApi'
import type { Cliente, ClienteInput } from '../types'

export function useCliente(id?: string) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelado = false
    clienteApi
      .getById(id)
      .then((dados) => {
        if (!cancelado) setCliente(dados)
      })
      .catch((e) => {
        if (!cancelado) setError(getErrorMessage(e))
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [id])

  async function save(input: ClienteInput) {
    setIsSaving(true)
    setError(null)
    try {
      const salvo = id
        ? await clienteApi.update(id, input)
        : await clienteApi.create(input)
      setCliente(salvo)
      return salvo
    } catch (e) {
      setError(getErrorMessage(e))
      return null
    } finally {
      setIsSaving(false)
    }
  }

  return { cliente, isLoading, isSaving, error, save }
}
