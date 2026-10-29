// Tipos do contrato da API (dinheiro sempre em reais, com no máximo 2 casas).

// ---------- Comuns ----------
export type Id = string // ObjectId de 24 hex
export type IsoDate = string // "2026-10-29T14:30:00.000Z"
export interface ApiErrorBody {
  error: string
}
export interface ApiUsuarioValidationErrorBody {
  message: string
}
export interface NotificationErrorBody {
  error: string
  eventoId: Id
  resultadoEnvio: ResultadoEnvio
}
export interface HealthResponse {
  status: 'ok'
}

// ---------- Enums ----------
export const STATUS_ORDEM = [
  'Em espera',
  'Diagnostico',
  'Em serviço',
  'Aguardando Peça',
  'Pausado',
  'Finalizado',
  'Cancelado',
] as const
export type StatusOrdem = (typeof STATUS_ORDEM)[number]
export const STATUS_COM_MOTIVO: readonly StatusOrdem[] = ['Pausado', 'Cancelado']
export const DECISOES = ['PENDENTE', 'APROVADO', 'RECUSADO'] as const
export type DecisaoOrcamento = (typeof DECISOES)[number]
export const DECISAO_LABEL: Record<DecisaoOrcamento, string> = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
}
export const TIPOS_ITEM = ['PECA', 'MAO_DE_OBRA'] as const
export type TipoItem = (typeof TIPOS_ITEM)[number]
export const STATUS_NOTIFICACAO = ['NAO_APLICAVEL', 'PENDENTE', 'ENVIADA', 'FALHA'] as const
export type StatusNotificacao = (typeof STATUS_NOTIFICACAO)[number]
export const RESULTADOS_ENVIO = ['REJEITADO', 'INCERTO'] as const
export type ResultadoEnvio = (typeof RESULTADOS_ENVIO)[number]

// ---------- Usuário ----------
export interface Usuario {
  id: Id
  nome: string
  email: string
  senhaHash: string
}
export interface UsuarioInput {
  nome: string
  email: string
  senhaHash: string
}
export type UsuarioUpdate = Partial<UsuarioInput>

// ---------- Cliente ----------
export interface Cliente {
  id: Id
  nome: string
  documento: string
  email: string
  telefone: string
}
export type ClienteInput = Omit<Cliente, 'id'>

// ---------- Veículo ----------
export interface Veiculo {
  id: Id
  modelo: string
  ano: string
  marca: string
  placa: string
  dono: Id
}
export type VeiculoInput = Omit<Veiculo, 'id'>
export interface VeiculoListQuery {
  clienteId?: Id
}

// ---------- Ordem de serviço ----------
export interface NotificacaoEvento {
  status: StatusNotificacao
  tentativaId: string | null
  ultimaTentativaEm: IsoDate | null
  resultadoEnvio: ResultadoEnvio | null
}
export interface Evento {
  id: Id
  status: StatusOrdem
  data: IsoDate
  motivo: string | null
  notificacao: NotificacaoEvento
}
// Itens, decisão e valor moram no orçamento vinculado (orcamentoId).
export interface OrdemServico {
  id: Id
  veiculoId: Id
  clienteId: Id
  orcamentoId: Id
  descricao: string
  status: StatusOrdem
  historico: Evento[]
}
// PUT: só estes 4 campos. Sem status/motivo (400 no backend).
export interface OrdemServicoInput {
  veiculoId: Id
  clienteId: Id
  orcamentoId: Id
  descricao: string
}
// Impede, em tempo de compilação, passar um OrdemServico inteiro ao PUT.
export type OrdemServicoUpdateInput = OrdemServicoInput & {
  status?: never
  motivo?: never
}
export interface OrdemServicoCreateInput extends OrdemServicoInput {
  status: StatusOrdem
  motivo?: string // obrigatório quando Pausado/Cancelado
}

// ---------- Eventos ----------
export interface EventoCreateInput {
  status: StatusOrdem
  data?: IsoDate
  motivo?: string
}
export type EventoUpdateInput = Partial<EventoCreateInput>

// ---------- Orçamento ----------
export interface ItemOrcamento {
  descricao: string
  tipo: TipoItem
  quantidade: number // inteiro > 0
  valorUnitario: number // reais, >= 0, até 2 casas
}
export interface Orcamento {
  id: Id
  nome: string | null
  telefone: string | null
  placa: string | null
  decisao: DecisaoOrcamento
  decisaoData: IsoDate
  valor: number // calculado pelo backend: Σ quantidade × valorUnitario
  itens: ItemOrcamento[]
}
// POST: a decisão nasce PENDENTE; o valor é calculado pelo backend.
export interface OrcamentoCreateInput {
  nome: string | null
  telefone: string | null
  placa: string | null
  itens: ItemOrcamento[]
}
// PUT: substituição total, com a decisão.
export interface OrcamentoInput extends OrcamentoCreateInput {
  decisao: DecisaoOrcamento
}

// ---------- Criação a partir do orçamento ----------
export interface ClienteFromOrcamentoInput {
  orcamentoId: Id
  documento: string
  email: string
}
export interface VeiculoFromOrcamentoInput {
  orcamentoId: Id
  dono: Id
  marca: string
  modelo: string
  ano: string
}
