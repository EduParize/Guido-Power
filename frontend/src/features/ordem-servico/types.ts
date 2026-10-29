export const STATUS_ORDEM = [
  'Em espera',
  'Diagnostico',
  'Em serviço',
  'Aguardando Peça',
  'Pausado',
  'Finalizado',
  'Cancelado',
] as const
export const STATUS_NOTIFICACAO = ['NAO_APLICAVEL', 'PENDENTE', 'ENVIADA', 'FALHA'] as const
export const RESULTADOS_ENVIO = ['REJEITADO', 'INCERTO'] as const
export const DECISOES = ['PENDENTE', 'APROVADO', 'RECUSADO'] as const
export const TIPOS_ITEM = ['PECA', 'MAO_DE_OBRA'] as const

export type StatusOrdem = (typeof STATUS_ORDEM)[number]
export type DecisaoOrdem = (typeof DECISOES)[number]
export type TipoItem = (typeof TIPOS_ITEM)[number]
export type StatusNotificacao = (typeof STATUS_NOTIFICACAO)[number]
export type ResultadoEnvio = (typeof RESULTADOS_ENVIO)[number]

export const STATUS_COM_MOTIVO: readonly StatusOrdem[] = ['Pausado', 'Cancelado']

export const STATUS_LABELS: Record<StatusOrdem, string> = {
  'Em espera': 'Em espera',
  Diagnostico: 'Diagnóstico',
  'Em serviço': 'Em serviço',
  'Aguardando Peça': 'Aguardando peça',
  Pausado: 'Pausado',
  Finalizado: 'Finalizado',
  Cancelado: 'Cancelado',
}

export const DECISAO_LABELS: Record<DecisaoOrdem, string> = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
}

export const TIPO_LABELS: Record<TipoItem, string> = {
  PECA: 'Peça',
  MAO_DE_OBRA: 'Mão de obra',
}

export interface ItemOrcamento {
  descricao: string
  tipo: TipoItem
  quantidade: number
  valorUnitario: number
}

export interface NotificacaoEvento {
  status: StatusNotificacao
  tentativaId: string | null
  ultimaTentativaEm: string | null
  resultadoEnvio: ResultadoEnvio | null
}

export interface Evento {
  id: string
  status: StatusOrdem
  data: string
  motivo: string | null
  notificacao: NotificacaoEvento
}

export interface EventoInput {
  status: StatusOrdem
  motivo?: string
}

export interface OrdemServico {
  id: string
  veiculoId: string
  clienteId: string
  decisao: DecisaoOrdem
  decisaoData: string
  descricao: string
  status: StatusOrdem
  historico: Evento[]
}

export interface OrdemServicoInput {
  veiculoId: string
  clienteId: string
  decisao: DecisaoOrdem
  descricao: string
}

export type OrdemServicoCreateInput = OrdemServicoInput & {
  status: StatusOrdem
  motivo?: string
}

export interface Orcamento {
  id: string
  ordemServicoId: string
  valor: number
  itens: ItemOrcamento[]
}

export interface OrcamentoInput {
  valor: number
  itens: ItemOrcamento[]
}
