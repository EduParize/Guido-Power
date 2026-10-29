import { useMemo } from 'react'
import { clientesApi } from '../../shared/api/clientes.ts'
import { orcamentosApi } from '../../shared/api/orcamentos.ts'
import { ordensServicoApi } from '../../shared/api/ordensServico.ts'
import type { Cliente, Id, Orcamento, Veiculo } from '../../shared/api/types.ts'
import { veiculosApi } from '../../shared/api/veiculos.ts'
import { useResource } from '../../shared/lib/useResource.ts'

/** Clientes, veículos, orçamentos e ordens, indexados por id (a OS só guarda ids). */
export function useCadastros() {
  const { data, error, isLoading, reload } = useResource(async (signal) => {
    const [clientes, veiculos, orcamentos, ordens] = await Promise.all([
      clientesApi.list(signal),
      veiculosApi.list({}, signal),
      orcamentosApi.list(signal),
      ordensServicoApi.list(signal),
    ])
    return { clientes, veiculos, orcamentos, ordens }
  }, [])
  const clientes = data?.clientes
  const veiculos = data?.veiculos
  const orcamentos = data?.orcamentos
  const clienteById = useMemo(() => new Map<Id, Cliente>((clientes ?? []).map((c) => [c.id, c])), [clientes])
  const veiculoById = useMemo(() => new Map<Id, Veiculo>((veiculos ?? []).map((v) => [v.id, v])), [veiculos])
  const orcamentoById = useMemo(() => new Map<Id, Orcamento>((orcamentos ?? []).map((o) => [o.id, o])), [orcamentos])
  return { clientes, veiculos, orcamentos, ordens: data?.ordens, clienteById, veiculoById, orcamentoById, error, isLoading, reload }
}
