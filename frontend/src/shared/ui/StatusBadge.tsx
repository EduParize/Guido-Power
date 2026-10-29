import { DECISAO_LABEL } from '../api/types.ts'
import type { DecisaoOrcamento, StatusOrdem } from '../api/types.ts'
import { Badge } from './Badge'
import type { BadgeTone } from './Badge'

const STATUS_TONE: Record<StatusOrdem, BadgeTone> = {
  'Em espera': 'neutral',
  Diagnostico: 'violet',
  'Em serviço': 'info',
  'Aguardando Peça': 'orange',
  Pausado: 'warning',
  Finalizado: 'success',
  Cancelado: 'danger',
}

const DECISAO_TONE: Record<DecisaoOrcamento, BadgeTone> = {
  PENDENTE: 'warning',
  APROVADO: 'success',
  RECUSADO: 'danger',
}

export function StatusBadge({ status, className }: { status: StatusOrdem; className?: string }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? 'neutral'} className={className}>
      {status}
    </Badge>
  )
}

export function DecisaoBadge({ decisao, className }: { decisao: DecisaoOrcamento; className?: string }) {
  return (
    <Badge tone={DECISAO_TONE[decisao] ?? 'neutral'} className={className}>
      {DECISAO_LABEL[decisao] ?? decisao}
    </Badge>
  )
}
