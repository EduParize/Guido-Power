import { useState } from 'react'
import type { FormEvent } from 'react'
import { eventosApi } from '../../shared/api/eventos.ts'
import { STATUS_ORDEM } from '../../shared/api/types.ts'
import type { EventoCreateInput, OrdemServico, StatusOrdem } from '../../shared/api/types.ts'
import { Button, Card, Field, Input, RequiredNote, Select, useToast } from '../../shared/ui'
import { focusFirstInvalid } from '../../features/budget/focusFirstInvalid.ts'
import { describeEventoError } from './eventosErrors'
import { needsMotivo } from './osFormState'

interface Props {
  os: OrdemServico
  /** Chamado após qualquer tentativa que possa ter alterado a OS (inclui 502, em que o evento é salvo). */
  onChanged: () => void
}

type Errors = Partial<Record<'status' | 'motivo' | 'data', string>>

export function AlterarStatusForm({ os, onChanged }: Props) {
  const toast = useToast()
  const [status, setStatus] = useState<StatusOrdem | ''>('')
  const [motivo, setMotivo] = useState('')
  const [data, setData] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const found: Errors = {}
    if (!status) found.status = 'Selecione o novo status'
    if (needsMotivo(status) && !motivo.trim()) found.motivo = 'Informe o motivo para este status'
    if (data && Number.isNaN(new Date(data).getTime())) found.data = 'Data inválida'
    setErrors(found)
    if (!status || Object.keys(found).length > 0) {
      focusFirstInvalid(form)
      return
    }
    const body: EventoCreateInput = { status }
    if (needsMotivo(status)) body.motivo = motivo.trim()
    if (data) body.data = new Date(data).toISOString()
    setSaving(true)
    try {
      await eventosApi.create(os.id, body)
      toast.success(`Status alterado para ${status}`)
      setStatus('')
      setMotivo('')
      setData('')
    } catch (e) {
      const { message, saved } = describeEventoError(e)
      toast.error(message)
      if (saved) {
        setStatus('')
        setMotivo('')
        setData('')
      }
    } finally {
      setSaving(false)
      onChanged()
    }
  }

  return (
    <Card>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4" aria-label="Alterar status">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl font-bold">Alterar status</h3>
          <RequiredNote />
        </div>
        <Field label="Novo status" required error={errors.status}>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusOrdem | '')
              setMotivo('')
            }}
            placeholder="Selecione o status"
          >
            {STATUS_ORDEM.filter((s) => s !== os.status).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        {needsMotivo(status) ? (
          <Field label="Motivo" required error={errors.motivo}>
            <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} autoComplete="off" />
          </Field>
        ) : null}
        <Field label="Data e hora" hint="Opcional. Sem data, vale o momento do registro." error={errors.data}>
          <Input type="datetime-local" value={data} onChange={(e) => setData(e.target.value)} />
        </Field>
        <p className="text-sm text-text-muted">O cliente é avisado da mudança por WhatsApp.</p>
        <Button type="submit" isLoading={saving} icon="check">Registrar mudança</Button>
      </form>
    </Card>
  )
}
