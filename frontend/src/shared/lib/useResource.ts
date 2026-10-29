import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage, isAbortError } from '../api/http.ts'

export interface ResourceState<T> {
  data: T | undefined
  error: string | null
  isLoading: boolean
  reload: () => void
}

interface Snapshot<T> {
  data: T | undefined
  error: string | null
  isLoading: boolean
}

/** Mantém `data` anterior durante recargas; cancela a requisição ao desmontar/trocar deps. */
export function useResource<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: unknown[]): ResourceState<T> {
  const [state, setState] = useState<Snapshot<T>>({ data: undefined, error: null, isLoading: true })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState((prev) => ({ ...prev, error: null, isLoading: true }))
    fetcher(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ data, error: null, isLoading: false })
      },
      (e: unknown) => {
        if (controller.signal.aborted || isAbortError(e)) return
        setState((prev) => ({ ...prev, error: getErrorMessage(e), isLoading: false }))
      },
    )
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps são fornecidas pelo chamador
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { data: state.data, error: state.error, isLoading: state.isLoading, reload }
}
