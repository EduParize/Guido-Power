import { useMemo } from 'react'
import { orcamentosApi } from '../../shared/api/orcamentos.ts'
import { useResource } from '../../shared/lib/useResource.ts'
import { deriveCatalogs } from './catalog.ts'
import type { ItemCatalogs } from './catalog.ts'

const NO_ORCAMENTOS: never[] = []

/** Peças e mão de obra conhecidas, derivadas dos itens de todos os orçamentos (A–Z). */
export function useItemCatalog(): ItemCatalogs & { isLoading: boolean; error: string | null; reload: () => void } {
  const { data, error, isLoading, reload } = useResource((signal) => orcamentosApi.list(signal), [])
  const catalogs = useMemo(() => deriveCatalogs(data ?? NO_ORCAMENTOS), [data])
  return { ...catalogs, isLoading, error, reload }
}
