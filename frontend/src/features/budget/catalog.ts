// Catálogo derivado dos itens dos orçamentos (não existe entidade de itens no backend). Puro: sem React.
import type { Orcamento } from '../../shared/api/types.ts'
import { decodeLaborDescricao } from '../../shared/lib/budget.ts'
import { round2 } from '../../shared/lib/money.ts'
import { normalize, sortAlpha } from '../../shared/lib/search.ts'

export interface CatalogItem {
  key: string
  descricao: string
  /** Valor do último orçamento que usou o item. */
  valorUnitario: number
  /** Em quantos orçamentos o item aparece. */
  usos: number
}

export interface LaborCatalogItem extends CatalogItem {
  /** true: valorUnitario é preço/hora; false: valor fixo do serviço. */
  porHora: boolean
}

export interface ItemCatalogs {
  parts: CatalogItem[]
  labor: LaborCatalogItem[]
}

export function catalogKey(descricao: string): string {
  return normalize(descricao).replace(/\s+/g, ' ')
}

interface Acc {
  descricao: string
  valorUnitario: number
  porHora: boolean
  at: number
  orcamentos: Set<string>
}

function collect(acc: Map<string, Acc>, id: string, at: number, descricao: string, valor: number, porHora: boolean) {
  const key = catalogKey(descricao)
  if (!key) return
  const found = acc.get(key)
  if (!found) {
    acc.set(key, { descricao: descricao.trim(), valorUnitario: valor, porHora, at, orcamentos: new Set([id]) })
    return
  }
  found.orcamentos.add(id)
  if (at >= found.at) {
    found.descricao = descricao.trim()
    found.valorUnitario = valor
    found.porHora = porHora
    found.at = at
  }
}

function toItems(acc: Map<string, Acc>): LaborCatalogItem[] {
  const items = [...acc.entries()].map(([key, a]) => ({
    key,
    descricao: a.descricao,
    valorUnitario: a.valorUnitario,
    usos: a.orcamentos.size,
    porHora: a.porHora,
  }))
  return sortAlpha(items, (i) => i.descricao)
}

export function deriveCatalogs(orcamentos: readonly Orcamento[]): ItemCatalogs {
  const parts = new Map<string, Acc>()
  const labor = new Map<string, Acc>()
  // Do mais antigo ao mais recente: o último valor visto prevalece.
  const at = (o: Orcamento) => Date.parse(o.decisaoData) || 0
  const ascending = [...orcamentos].sort((a, b) => at(a) - at(b))
  for (const o of ascending) {
    for (const item of o.itens) {
      if (item.tipo === 'PECA') {
        collect(parts, o.id, at(o), item.descricao, item.valorUnitario, false)
        continue
      }
      const decoded = decodeLaborDescricao(item.descricao)
      if (decoded) collect(labor, o.id, at(o), decoded.descricao, decoded.precoHora, true)
      else collect(labor, o.id, at(o), item.descricao, round2(item.quantidade * item.valorUnitario), false)
    }
  }
  return { parts: toItems(parts), labor: toItems(labor) }
}
