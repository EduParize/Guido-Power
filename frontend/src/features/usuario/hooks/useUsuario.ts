import { useEffect, useState } from 'react'
import { getErrorMessage } from '../../../shared/api/client'
import { usuarioApi } from '../api/usuarioApi'
import type { Usuario, UsuarioInput, UsuarioUpdate } from '../types'

export function useUsuario(id?: string) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelado = false
    usuarioApi
      .getById(id)
      .then((dados) => {
        if (!cancelado) setUsuario(dados)
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

  // na criação o formulário garante os três campos
  async function save(input: UsuarioUpdate) {
    setIsSaving(true)
    setError(null)
    try {
      const salvo = id
        ? await usuarioApi.update(id, input)
        : await usuarioApi.create(input as UsuarioInput)
      setUsuario(salvo)
      return salvo
    } catch (e) {
      setError(getErrorMessage(e))
      return null
    } finally {
      setIsSaving(false)
    }
  }

  return { usuario, isLoading, isSaving, error, save }
}
