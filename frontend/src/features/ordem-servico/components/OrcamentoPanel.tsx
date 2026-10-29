import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert } from '../../../shared/ui/Alert'
import { Card } from '../../../shared/ui/Card'
import type { ItemOrcamento, Orcamento, OrcamentoInput } from '../types'
import { formatMoeda } from './formatMoeda'
import { ItensEditor } from './ItensEditor'

type OrcamentoPanelProps = {
  orcamento: Orcamento | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  onSave: (input: OrcamentoInput) => Promise<Orcamento | null>
  onRemove: () => Promise<boolean>
}

export function OrcamentoPanel({
  orcamento,
  isLoading,
  isSaving,
  error,
  onSave,
  onRemove,
}: OrcamentoPanelProps) {
  const [valor, setValor] = useState(orcamento ? String(orcamento.valor) : '')
  const [itens, setItens] = useState<ItemOrcamento[]>(orcamento?.itens ?? [])
  const [mensagem, setMensagem] = useState<string | null>(null)

  useEffect(() => {
    setValor(orcamento ? String(orcamento.valor) : '')
    setItens(orcamento?.itens ?? [])
  }, [orcamento])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMensagem(null)
    const salvo = await onSave({
      valor: Number(valor),
      itens,
    })
    if (salvo) setMensagem('Orçamento salvo')
  }

  async function handleRemove() {
    setMensagem(null)
    const ok = await onRemove()
    if (ok) {
      setValor('')
      setItens([])
      setMensagem('Orçamento removido')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Carregando orçamento...</p>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="form-section-title">Orçamento</h2>
            <p className="mt-1 text-sm text-slate-500">
              {orcamento ? `Total atual: ${formatMoeda(orcamento.valor)}` : 'Nenhum orçamento cadastrado'}
            </p>
          </div>
          {orcamento && (
            <button
              type="button"
              className="btn-ghost-danger"
              disabled={isSaving}
              onClick={() => void handleRemove()}
            >
              Remover orçamento
            </button>
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {mensagem && <Alert variant="success">{mensagem}</Alert>}

        <label className="field-label max-w-xs">
          Valor total (R$)
          <input
            className="input mt-1 tabular-nums"
            type="number"
            min={0}
            step={0.01}
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <span className="field-hint">Valor em reais, ex.: 350,00</span>
        </label>

        <ItensEditor itens={itens} onChange={setItens} />

        <div className="form-footer">
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar orçamento'}
          </button>
        </div>
      </form>
    </Card>
  )
}
