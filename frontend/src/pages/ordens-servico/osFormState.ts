import type {
  Cliente,
  Id,
  Orcamento,
  OrdemServico,
  OrdemServicoCreateInput,
  OrdemServicoUpdateInput,
  StatusOrdem,
  Veiculo,
} from '../../shared/api/types.ts'
import { STATUS_COM_MOTIVO } from '../../shared/api/types.ts'
import { sortAlpha } from '../../shared/lib/search.ts'
import { telefoneDigits } from '../clientes/format'
import { formatPlaca, normalizePlaca } from '../veiculos/format'

export interface OsFormState {
  orcamentoId: Id | ''
  clienteId: Id | ''
  veiculoId: Id | ''
  descricao: string
  /** '' = ainda não escolhido (criação começa sem seleção). */
  status: StatusOrdem | ''
  motivo: string
}

export type OsFormErrors = Partial<Record<'orcamento' | 'cliente' | 'veiculo' | 'descricao' | 'status' | 'motivo', string>>

export const needsMotivo = (status: StatusOrdem | ''): boolean =>
  status !== '' && STATUS_COM_MOTIVO.includes(status)

/** Orçamentos aprovados ainda sem OS, A–Z por nome (a OS em edição mantém o seu). */
export function orcamentosDisponiveis(
  orcamentos: readonly Orcamento[],
  ordens: readonly OrdemServico[],
  ordemAtualId: Id | undefined,
): Orcamento[] {
  const usados = new Set(ordens.filter((o) => o.id !== ordemAtualId).map((o) => o.orcamentoId))
  const aprovados = orcamentos.filter((o) => o.decisao === 'APROVADO' && !usados.has(o.id))
  return [...sortAlpha(aprovados.filter((o) => o.nome), (o) => o.nome ?? ''), ...aprovados.filter((o) => !o.nome)]
}

/** Cliente e veículo prováveis do orçamento: veículo pela placa (traz o dono) ou cliente pelo telefone. */
export function sugerirCadastros(
  orcamento: Orcamento | undefined,
  clientes: readonly Cliente[],
  veiculos: readonly Veiculo[],
): { clienteId: Id | ''; veiculoId: Id | '' } {
  if (!orcamento) return { clienteId: '', veiculoId: '' }
  const placa = orcamento.placa ? normalizePlaca(orcamento.placa) : ''
  const veiculo = placa ? veiculos.find((v) => normalizePlaca(v.placa) === placa) : undefined
  if (veiculo) return { clienteId: veiculo.dono, veiculoId: veiculo.id }
  const telefone = orcamento.telefone ? telefoneDigits(orcamento.telefone) : ''
  const cliente = telefone ? clientes.find((c) => telefoneDigits(c.telefone) === telefone) : undefined
  return { clienteId: cliente?.id ?? '', veiculoId: '' }
}

export function initialOsState(
  os: OrdemServico | undefined,
  base: { orcamentoId?: Id; clienteId?: Id } = {},
): OsFormState {
  if (os) {
    return {
      orcamentoId: os.orcamentoId,
      clienteId: os.clienteId,
      veiculoId: os.veiculoId,
      descricao: os.descricao,
      status: '',
      motivo: '',
    }
  }
  return {
    orcamentoId: base.orcamentoId ?? '',
    clienteId: base.clienteId ?? '',
    veiculoId: '',
    descricao: '',
    status: '',
    motivo: '',
  }
}

/** O backend exige a mesma placa quando o orçamento tem uma. */
export function placaDivergente(orcamento: Orcamento | undefined, veiculo: Veiculo | undefined): string | undefined {
  if (!orcamento?.placa || !veiculo) return undefined
  if (normalizePlaca(orcamento.placa) === normalizePlaca(veiculo.placa)) return undefined
  return `A placa do veículo (${formatPlaca(veiculo.placa)}) difere da placa do orçamento (${formatPlaca(orcamento.placa)}).`
}

export function validateOs(s: OsFormState, mode: 'create' | 'edit'): OsFormErrors {
  const e: OsFormErrors = {}
  if (!s.orcamentoId) e.orcamento = 'Selecione o orçamento aprovado'
  if (!s.clienteId) e.cliente = 'Selecione o cliente'
  if (!s.veiculoId) e.veiculo = s.clienteId ? 'Selecione o veículo' : 'Selecione primeiro o cliente'
  if (!s.descricao.trim()) e.descricao = 'Descreva o serviço ou o problema relatado'
  if (mode === 'create') {
    if (!s.status) e.status = 'Selecione o status inicial'
    if (needsMotivo(s.status) && !s.motivo.trim()) e.motivo = 'Informe o motivo para este status'
  }
  return e
}

function baseFields(s: OsFormState & { orcamentoId: Id; clienteId: Id; veiculoId: Id }) {
  return {
    veiculoId: s.veiculoId,
    clienteId: s.clienteId,
    orcamentoId: s.orcamentoId,
    descricao: s.descricao.trim(),
  }
}

/** Só chamar após `validateOs` sem erros. */
export function toCreateInput(s: OsFormState): OrdemServicoCreateInput {
  if (!s.orcamentoId || !s.clienteId || !s.veiculoId || !s.status) throw new Error('Formulário incompleto')
  const input: OrdemServicoCreateInput = {
    ...baseFields({ ...s, orcamentoId: s.orcamentoId, clienteId: s.clienteId, veiculoId: s.veiculoId }),
    status: s.status,
  }
  if (needsMotivo(s.status)) input.motivo = s.motivo.trim()
  return input
}

/** PUT: só 4 campos (status/motivo geram 400 no backend). */
export function toUpdateInput(s: OsFormState): OrdemServicoUpdateInput {
  if (!s.orcamentoId || !s.clienteId || !s.veiculoId) throw new Error('Formulário incompleto')
  return baseFields({ ...s, orcamentoId: s.orcamentoId, clienteId: s.clienteId, veiculoId: s.veiculoId })
}
