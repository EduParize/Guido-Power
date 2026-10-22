import { Icon } from '../../../shared/ui/Icon'
import { TIPO_LABELS, TIPOS_ITEM } from '../types'
import type { ItemOrdem, TipoItem } from '../types'

const NOVO_ITEM: ItemOrdem = { descricao: '', tipo: 'PECA', quantidade: 1, valorUnitario: 0 }
const COLUNAS = 'sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_5rem_minmax(0,1fr)_5rem]'

interface ItensEditorProps {
  itens: ItemOrdem[]
  onChange: (itens: ItemOrdem[]) => void
}

export function ItensEditor({ itens, onChange }: ItensEditorProps) {
  function updateItem(indice: number, campos: Partial<ItemOrdem>) {
    onChange(itens.map((item, i) => (i === indice ? { ...item, ...campos } : item)))
  }

  return (
    <fieldset>
      <legend className="form-section-title w-full">Itens</legend>
      {itens.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
          Nenhum item adicionado.
        </p>
      )}
      {itens.length > 0 && (
        <div className="space-y-3">
          <div
            aria-hidden="true"
            className={`hidden gap-3 px-1 text-xs font-semibold tracking-wide text-slate-600 uppercase sm:grid ${COLUNAS}`}
          >
            <span>Descrição</span>
            <span>Tipo</span>
            <span className="text-right">Qtd.</span>
            <span className="text-right">Valor unitário (R$)</span>
            <span />
          </div>
          {itens.map((item, indice) => (
            <div
              key={indice}
              className={`grid gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:items-start sm:border-0 sm:bg-transparent sm:p-0 ${COLUNAS}`}
            >
              <label className="field-label">
                <span className="sm:sr-only">Descrição</span>
                <input
                  className="input mt-1 sm:mt-0"
                  required
                  value={item.descricao}
                  onChange={(e) => updateItem(indice, { descricao: e.target.value })}
                />
              </label>
              <label className="field-label">
                <span className="sm:sr-only">Tipo</span>
                <select
                  className="input mt-1 sm:mt-0"
                  value={item.tipo}
                  onChange={(e) => updateItem(indice, { tipo: e.target.value as TipoItem })}
                >
                  {TIPOS_ITEM.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {TIPO_LABELS[tipo]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                <span className="sm:sr-only">Qtd.</span>
                <input
                  className="input mt-1 text-right tabular-nums sm:mt-0"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={item.quantidade}
                  onChange={(e) => updateItem(indice, { quantidade: Number(e.target.value) })}
                />
              </label>
              <label className="field-label">
                <span className="sm:sr-only">Valor unitário (R$)</span>
                <input
                  className="input mt-1 text-right tabular-nums sm:mt-0"
                  type="number"
                  min={0}
                  step={0.01}
                  required
                  value={item.valorUnitario}
                  onChange={(e) => updateItem(indice, { valorUnitario: Number(e.target.value) })}
                />
              </label>
              <button
                type="button"
                className="btn-ghost-danger sm:mt-1"
                aria-label={`Remover item ${indice + 1}`}
                onClick={() => onChange(itens.filter((_, i) => i !== indice))}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        className="btn-secondary btn-sm mt-4"
        onClick={() => onChange([...itens, NOVO_ITEM])}
      >
        <Icon name="plus" className="h-4 w-4" />
        Adicionar item
      </button>
    </fieldset>
  )
}
