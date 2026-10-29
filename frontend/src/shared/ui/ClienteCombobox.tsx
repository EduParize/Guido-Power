import { useMemo } from 'react'
import { clientesApi } from '../api/clientes.ts'
import type { Cliente, Id, Veiculo } from '../api/types.ts'
import { veiculosApi } from '../api/veiculos.ts'
import { matchesQuery, normalize } from '../lib/search.ts'
import { useResource } from '../lib/useResource.ts'
import { formatDocumento, formatTelefone } from '../../pages/clientes/format'
import { formatPlaca } from '../../pages/veiculos/format'
import { Combobox } from './Combobox'

interface Option {
  cliente: Cliente
  veiculos: Veiculo[]
}

export interface ClienteComboboxProps {
  /** Id do cliente selecionado, ou '' quando não há seleção. */
  value: Id | ''
  /** Chamado com o id escolhido (ou '' ao limpar) e o cliente completo. */
  onChange: (id: Id | '', cliente?: Cliente) => void
  /** Rótulo visível (padrão "Cliente"). */
  label?: string
  placeholder?: string
  required?: boolean
  /** Mensagem de erro do campo (ativa aria-invalid e aria-describedby). */
  error?: string | null
  disabled?: boolean
  className?: string
  /** Listas já carregadas pelo chamador; o que faltar é buscado na API. */
  clientes?: Cliente[]
  veiculos?: Veiculo[]
}

const getKey = (o: Option) => o.cliente.id
const getLabel = (o: Option) => o.cliente.nome

function fields(o: Option): string[] {
  const { cliente: c } = o
  return [
    c.nome,
    c.documento,
    formatDocumento(c.documento),
    c.telefone,
    formatTelefone(c.telefone),
    c.email,
    ...o.veiculos.flatMap((v) => [v.placa, formatPlaca(v.placa), v.modelo, v.marca]),
  ]
}

const filter = (o: Option, query: string) => matchesQuery(query, ...fields(o))

function matchedVeiculo(o: Option, query: string): Veiculo | undefined {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return undefined
  return o.veiculos.find((v) =>
    terms.some((t) => matchesQuery(t, v.placa, formatPlaca(v.placa), v.modelo, v.marca)),
  )
}

/**
 * Seletor de cliente com busca digitável (nome, documento, telefone, e-mail e placa/modelo dos veículos).
 * Opções em ordem A–Z por nome; quando a busca casa com um veículo, a placa aparece no texto secundário.
 * Sem `clientes`/`veiculos`, busca os dados na API sozinho.
 */
export function ClienteCombobox({
  value,
  onChange,
  label = 'Cliente',
  placeholder = 'Digite nome, documento, telefone ou placa',
  required,
  error,
  disabled,
  className,
  clientes,
  veiculos,
}: ClienteComboboxProps) {
  const missing = { clientes: !clientes, veiculos: !veiculos }
  const loaded = useResource(
    async (signal) => ({
      clientes: missing.clientes ? await clientesApi.list(signal) : [],
      veiculos: missing.veiculos ? await veiculosApi.list({}, signal) : [],
    }),
    [missing.clientes, missing.veiculos],
  )
  const allClientes = clientes ?? loaded.data?.clientes
  const allVeiculos = veiculos ?? loaded.data?.veiculos

  const options = useMemo<Option[]>(() => {
    const byDono = new Map<Id, Veiculo[]>()
    for (const v of allVeiculos ?? []) byDono.set(v.dono, [...(byDono.get(v.dono) ?? []), v])
    return (allClientes ?? []).map((cliente) => ({ cliente, veiculos: byDono.get(cliente.id) ?? [] }))
  }, [allClientes, allVeiculos])

  const selected = options.find((o) => o.cliente.id === value) ?? null

  return (
    <Combobox<Option>
      items={options}
      getKey={getKey}
      getLabel={getLabel}
      filter={filter}
      value={selected}
      onChange={(o) => (o ? onChange(o.cliente.id, o.cliente) : onChange(''))}
      label={label}
      placeholder={loaded.isLoading && !allClientes ? 'Carregando clientes…' : placeholder}
      required={required}
      error={error ?? loaded.error}
      disabled={disabled}
      className={className}
      emptyText="Nenhum cliente encontrado"
      renderItem={(o, { query, label: nome }) => {
        const v = matchedVeiculo(o, query)
        return (
          <span className="flex flex-col">
            <span>{nome}</span>
            <span className="text-sm opacity-80">
              {[formatDocumento(o.cliente.documento), formatTelefone(o.cliente.telefone)].filter(Boolean).join(' · ')}
              {v ? (
                <>
                  {' · '}
                  <span className="font-mono font-bold">{formatPlaca(v.placa)}</span> {v.marca} {v.modelo}
                </>
              ) : null}
            </span>
          </span>
        )
      }}
    />
  )
}
