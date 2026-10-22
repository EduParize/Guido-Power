import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alert } from '../../../shared/ui/Alert'
import { Card } from '../../../shared/ui/Card'
import { STATUS_COM_MOTIVO, STATUS_LABELS, STATUS_ORDEM } from '../types'
import type { Evento, EventoInput, StatusOrdem } from '../types'
import { STATUS_STYLES } from './statusStyles'

interface EventosPanelProps {
  eventos: Evento[]
  statusAtual: StatusOrdem
  isLoading: boolean
  isSaving: boolean
  error: string | null
  onAdd: (input: EventoInput) => Promise<boolean>
  onReenviar: (eventoId: string) => Promise<boolean>
}

interface NotificacaoIndicadorProps {
  evento: Evento
  podeReenviar: boolean
  isSaving: boolean
  onReenviar: (eventoId: string) => void
}

function NotificacaoIndicador({ evento, podeReenviar, isSaving, onReenviar }: NotificacaoIndicadorProps) {
  const { status, resultadoEnvio } = evento.notificacao

  if (status === 'ENVIADA') return <p className="mt-1 text-xs text-green-700">WhatsApp enviado</p>
  if (status === 'PENDENTE') return <p className="mt-1 text-xs text-slate-500">Enviando WhatsApp...</p>
  if (status === 'NAO_APLICAVEL') return null

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2">
      <p className="text-xs text-red-700">
        Falha no WhatsApp
        {resultadoEnvio === 'INCERTO' && ' (resultado incerto, o reenvio pode duplicar a mensagem)'}
      </p>
      {podeReenviar && (
        <button
          type="button"
          className="btn-ghost"
          disabled={isSaving}
          onClick={() => onReenviar(evento.id)}
        >
          Reenviar
        </button>
      )}
    </div>
  )
}

export function EventosPanel({
  eventos,
  statusAtual,
  isLoading,
  isSaving,
  error,
  onAdd,
  onReenviar,
}: EventosPanelProps) {
  const [escolhido, setEscolhido] = useState<StatusOrdem | null>(null)
  const [motivo, setMotivo] = useState('')
  const opcoes = STATUS_ORDEM.filter((opcao) => opcao !== statusAtual)
  const status = escolhido && escolhido !== statusAtual ? escolhido : opcoes[0]
  const motivoObrigatorio = STATUS_COM_MOTIVO.includes(status)
  const eventoAtualId = eventos.at(-1)?.id

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const texto = motivo.trim()
    const ok = await onAdd(texto ? { status, motivo: texto } : { status })
    if (ok) {
      setMotivo('')
      setEscolhido(null)
    }
  }

  return (
    <Card title="Eventos" className="space-y-5">
      {error && <Alert variant="error">{error}</Alert>}
      {isLoading && <p className="text-sm text-slate-500">Carregando...</p>}
      {!isLoading && eventos.length === 0 && (
        <p className="text-sm text-slate-500">Nenhum evento registrado.</p>
      )}
      {eventos.length > 0 && (
        <ol className="ml-1.5 border-l-2 border-slate-200">
          {eventos.map((evento) => (
            <li key={evento.id} className="relative pb-5 pl-6 last:pb-0">
              <span
                aria-hidden="true"
                className={`absolute top-1 -left-[7px] h-3 w-3 rounded-full ring-4 ring-white ${STATUS_STYLES[evento.status].dot}`}
              />
              <p className="text-sm font-semibold text-slate-900">{STATUS_LABELS[evento.status]}</p>
              <p className="text-xs text-slate-500">
                <time dateTime={evento.data}>{new Date(evento.data).toLocaleString('pt-BR')}</time>
              </p>
              {evento.motivo && <p className="mt-1 text-sm text-slate-700">{evento.motivo}</p>}
              <NotificacaoIndicador
                evento={evento}
                podeReenviar={evento.id === eventoAtualId}
                isSaving={isSaving}
                onReenviar={(eventoId) => void onReenviar(eventoId)}
              />
            </li>
          ))}
        </ol>
      )}
      <form onSubmit={handleSubmit} className="border-t border-slate-200 pt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Novo status
            <select
              className="input mt-1"
              value={status}
              onChange={(e) => setEscolhido(e.target.value as StatusOrdem)}
            >
              {opcoes.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {STATUS_LABELS[opcao]}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label sm:col-span-2">
            Motivo{motivoObrigatorio ? '' : ' (opcional)'}
            <textarea
              className="input mt-1"
              rows={2}
              required={motivoObrigatorio}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            {motivoObrigatorio && <span className="field-hint">Obrigatório para este status</span>}
          </label>
        </div>
        <div className="mt-4">
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Adicionar evento'}
          </button>
        </div>
      </form>
    </Card>
  )
}
