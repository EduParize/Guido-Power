import { useState } from 'react'
import { eventosApi } from '../../shared/api/eventos.ts'
import { STATUS_ORDEM } from '../../shared/api/types.ts'
import type { Evento, EventoUpdateInput, OrdemServico, StatusOrdem } from '../../shared/api/types.ts'
import { Alert, Button, Field, Input, Modal, Select, useToast } from '../../shared/ui'
import { focusFirstInvalid } from '../../features/budget/focusFirstInvalid.ts'
import { describeEventoError } from './eventosErrors'
import { needsMotivo } from './osFormState'
import { toLocalInput } from './osUtils'

interface Props {
  os: OrdemServico
  evento: Evento
  isCurrent: boolean
  onClose: () => void
  onChanged: () => void
}

type Errors = Partial<Record<'motivo' | 'data', string>>

export function EventoEditModal({ os, evento, isCurrent, onClose, onChanged }: Props) {
  const toast = useToast()
  const initialData = toLocalInput(evento.data)
  const [status, setStatus] = useState<StatusOrdem>(evento.status)
  const [data, setData] = useState(initialData)
  const [motivo, setMotivo] = useState(evento.motivo ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const statusMudou = status !== evento.status

  async function save() {
    const found: Errors = {}
    if (needsMotivo(status) && !motivo.trim()) found.motivo = 'Informe o motivo para este status'
    if (!data || Number.isNaN(new Date(data).getTime())) found.data = 'Informe uma data válida'
    setErrors(found)
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(document.getElementById('evento-edit-form'))
      return
    }
    const body: EventoUpdateInput = {}
    if (statusMudou) body.status = status
    if (data !== initialData) body.data = new Date(data).toISOString()
    if (needsMotivo(status) && (statusMudou || motivo.trim() !== (evento.motivo ?? ''))) body.motivo = motivo.trim()
    if (Object.keys(body).length === 0) {
      onClose()
      return
    }
    setSaving(true)
    try {
      await eventosApi.update(os.id, evento.id, body)
      toast.success('Evento atualizado')
      onClose()
    } catch (e) {
      const { message, saved } = describeEventoError(e)
      toast.error(message)
      if (saved) onClose()
    } finally {
      setSaving(false)
      onChanged()
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Editar evento"
      description="Corrija o status, a data ou o motivo deste registro do histórico."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} isLoading={saving} icon="check">Salvar evento</Button>
        </>
      }
    >
      <div id="evento-edit-form" className="flex flex-col gap-4">
        <Field label="Status" required>
          <Select value={status} onChange={(e) => setStatus(e.target.value as StatusOrdem)}>
            {STATUS_ORDEM.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        {needsMotivo(status) ? (
          <Field label="Motivo" required error={errors.motivo}>
            <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} autoComplete="off" />
          </Field>
        ) : null}
        <Field label="Data e hora" required error={errors.data}>
          <Input type="datetime-local" value={data} onChange={(e) => setData(e.target.value)} />
        </Field>
        {isCurrent && statusMudou ? (
          <Alert tone="info">Como este é o evento atual, mudar o status avisa o cliente por WhatsApp.</Alert>
        ) : null}
      </div>
    </Modal>
  )
}
