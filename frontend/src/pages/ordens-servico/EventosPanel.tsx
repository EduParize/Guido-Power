import { useState } from 'react'
import { eventosApi } from '../../shared/api/eventos.ts'
import type { Evento, OrdemServico } from '../../shared/api/types.ts'
import { Card, ConfirmDialog, EmptyState, useToast } from '../../shared/ui'
import { AlterarStatusForm } from './AlterarStatusForm'
import { EventoEditModal } from './EventoEditModal'
import { EventoItem } from './EventoItem'
import { describeEventoError } from './eventosErrors'

export function EventosPanel({ os, onChanged }: { os: OrdemServico; onChanged: () => void }) {
  const toast = useToast()
  const [editing, setEditing] = useState<Evento | null>(null)
  const [deleting, setDeleting] = useState<Evento | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Ordem cronológica no backend; a linha do tempo mostra o mais recente primeiro.
  const ordered = [...os.historico].reverse()
  const currentId = os.historico[os.historico.length - 1]?.id

  async function run(eventoId: string, action: () => Promise<unknown>, success: string) {
    setBusyId(eventoId)
    try {
      await action()
      toast.success(success)
    } catch (e) {
      toast.error(describeEventoError(e).message)
    } finally {
      setBusyId(null)
      onChanged()
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card>
        <h3 className="mb-5 text-xl font-bold">Linha do tempo</h3>
        {ordered.length === 0 ? (
          <EmptyState title="Sem eventos" description="O histórico desta ordem está vazio." />
        ) : (
          <ol aria-label="Histórico de status">
            {ordered.map((ev) => {
              const isCurrent = ev.id === currentId
              const notif = ev.notificacao.status
              return (
                <EventoItem
                  key={ev.id}
                  evento={ev}
                  isCurrent={isCurrent}
                  canDelete={os.historico.length > 1}
                  canResend={isCurrent && ev.status === os.status && (notif === 'FALHA' || notif === 'PENDENTE')}
                  busy={busyId === ev.id}
                  onEdit={() => setEditing(ev)}
                  onDelete={() => setDeleting(ev)}
                  onResend={() => void run(ev.id, () => eventosApi.resend(os.id, ev.id), 'Notificação reenviada')}
                />
              )
            })}
          </ol>
        )}
      </Card>
      <AlterarStatusForm os={os} onChanged={onChanged} />
      {editing ? (
        <EventoEditModal
          os={os}
          evento={editing}
          isCurrent={editing.id === currentId}
          onClose={() => setEditing(null)}
          onChanged={onChanged}
        />
      ) : null}
      <ConfirmDialog
        open={deleting !== null}
        title="Excluir evento"
        tone="danger"
        confirmLabel="Excluir evento"
        isLoading={busyId !== null}
        message={
          deleting?.id === currentId
            ? `Excluir o evento "${deleting?.status}"? A ordem volta ao status anterior.`
            : `Excluir o evento "${deleting?.status}" do histórico?`
        }
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const alvo = deleting
          if (!alvo) return
          void run(alvo.id, () => eventosApi.remove(os.id, alvo.id), 'Evento excluído').then(() => setDeleting(null))
        }}
      />
    </div>
  )
}
