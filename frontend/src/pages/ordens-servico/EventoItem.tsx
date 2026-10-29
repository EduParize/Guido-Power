import type { Evento, StatusNotificacao } from '../../shared/api/types.ts'
import { Badge, IconButton, Button, StatusBadge } from '../../shared/ui'
import type { BadgeTone } from '../../shared/ui'
import { RESULTADO_TEXTO } from './eventosErrors'
import { dateTimeFmt } from './osUtils'

const NOTIF: Record<StatusNotificacao, { label: string; tone: BadgeTone }> = {
  NAO_APLICAVEL: { label: 'Sem notificação', tone: 'neutral' },
  PENDENTE: { label: 'Enviando WhatsApp…', tone: 'warning' },
  ENVIADA: { label: 'WhatsApp enviado', tone: 'success' },
  FALHA: { label: 'Falha no WhatsApp', tone: 'danger' },
}

export interface EventoItemProps {
  evento: Evento
  isCurrent: boolean
  canDelete: boolean
  canResend: boolean
  busy: boolean
  onEdit: () => void
  onDelete: () => void
  onResend: () => void
}

export function EventoItem({ evento, isCurrent, canDelete, canResend, busy, onEdit, onDelete, onResend }: EventoItemProps) {
  const notif = NOTIF[evento.notificacao.status]
  const pendente = evento.notificacao.status === 'PENDENTE'
  const resultado = evento.notificacao.resultadoEnvio
  return (
    <li className="relative border-l-2 border-border-strong pb-6 pl-6 last:pb-0">
      <span
        aria-hidden="true"
        className="absolute top-1.5 -left-[7px] h-3 w-3 rounded-full border-2 border-surface bg-primary"
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusBadge status={evento.status} />
        {isCurrent ? <Badge tone="info">Atual</Badge> : null}
        <time dateTime={evento.data} className="text-[15px] font-semibold tabular-nums">
          {dateTimeFmt.format(new Date(evento.data))}
        </time>
        <Badge tone={notif.tone}>{notif.label}</Badge>
        <div className="ml-auto flex items-center gap-1">
          {canResend ? (
            <Button size="sm" variant="secondary" icon="whatsapp" onClick={onResend} disabled={busy}>
              Reenviar notificação
            </Button>
          ) : null}
          <IconButton
            aria-label={`Editar evento ${evento.status}`}
            icon="edit"
            size="sm"
            disabled={busy || pendente}
            onClick={onEdit}
            title={pendente ? 'Aguarde o fim do envio da notificação' : 'Editar evento'}
          />
          {canDelete ? (
            <IconButton
              aria-label={`Excluir evento ${evento.status}`}
              icon="trash"
              size="sm"
              className="text-danger"
              disabled={busy || pendente}
              onClick={onDelete}
              title={pendente ? 'Aguarde o fim do envio da notificação' : 'Excluir evento'}
            />
          ) : null}
        </div>
      </div>
      {evento.motivo ? (
        <p className="mt-2 text-base">
          <span className="font-semibold">Motivo:</span> {evento.motivo}
        </p>
      ) : null}
      {evento.notificacao.status === 'FALHA' && resultado ? (
        <p className="mt-2 text-sm font-medium text-danger">{RESULTADO_TEXTO[resultado]}</p>
      ) : null}
    </li>
  )
}
