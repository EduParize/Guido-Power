import type { Cliente, Id, Orcamento, OrdemServico, StatusOrdem, Veiculo } from '../../shared/api/types.ts'
import { formatBRL } from '../../shared/lib/money.ts'
import { formatPlaca } from '../veiculos/format'

export const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export const shortId = (id: Id) => `#${id.slice(-6)}`

export const STATUS_PLACEHOLDER = 'Selecione o status'

export function veiculoLabel(v: Veiculo | undefined): string {
  return v ? `${formatPlaca(v.placa)} — ${[v.marca, v.modelo].filter(Boolean).join(' ')}` : '—'
}

export function clienteNome(clientes: Map<Id, Cliente>, id: Id): string {
  return clientes.get(id)?.nome ?? '—'
}

/** Status que exigem motivo: o select de criação/alteração mostra o campo ao escolhê-los. */
export function isStatus(value: string, list: readonly StatusOrdem[]): value is StatusOrdem {
  return (list as readonly string[]).includes(value)
}

/** Converte ISO em valor de <input type="datetime-local"> (hora local, minutos). */
export function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Última atividade da OS: o evento mais recente do histórico. */
export function lastActivity(o: OrdemServico): number {
  return o.historico.reduce((max, e) => Math.max(max, Date.parse(e.data) || 0), 0)
}

/** Orçamento nomeado + placa, como aparece nas listas e no seletor. */
export function orcamentoLabel(o: Orcamento): string {
  return [o.nome || `Sem nome ${shortId(o.id)}`, o.placa ? formatPlaca(o.placa) : null, formatBRL(o.valor)].filter(Boolean).join(' · ')
}
