// Motor de orçamento (puro, sem React). O backend calcula valor = Σ quantidade × valorUnitario dos itens.
import type { ItemOrcamento } from '../api/types.ts'
import { formatBRL, parseDecimalBR, round2 } from './money.ts'

export interface PecaLinha {
  key: string
  descricao: string
  quantidade: number
  valorUnitario: number
}

/** Modo horas: horas e precoHora preenchidos. Caso contrário vale valorFixo. */
export interface MaoDeObraLinha {
  key: string
  descricao: string
  horas: number | null
  precoHora: number | null
  valorFixo: number | null
}

export interface BudgetState {
  pecas: PecaLinha[]
  maoDeObra: MaoDeObraLinha[]
}

export interface BudgetTotals {
  totalPecas: number
  totalMaoDeObra: number
  total: number
}

const LABOR_SUFFIX = /^(.*?)\s*— (\d+(?:,\d+)?) h × R\$\s?([\d.]+,\d{2})\/h$/
const HOURS_DECIMALS = 4

let keyCounter = 0
export function newKey(): string {
  keyCounter += 1
  return `linha-${keyCounter}`
}

export function emptyPeca(): PecaLinha {
  return { key: newKey(), descricao: '', quantidade: 1, valorUnitario: 0 }
}

export function emptyMaoDeObra(precoHora: number): MaoDeObraLinha {
  return { key: newKey(), descricao: '', horas: null, precoHora, valorFixo: null }
}

function finite(n: number | null | undefined): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

function roundHours(h: number): number {
  const f = 10 ** HOURS_DECIMALS
  return Math.round(h * f) / f
}

function isHoursMode(l: MaoDeObraLinha): l is MaoDeObraLinha & { horas: number; precoHora: number } {
  return l.horas !== null && l.precoHora !== null
}

export function laborValue(l: MaoDeObraLinha): number {
  if (isHoursMode(l)) return round2(roundHours(finite(l.horas)) * round2(finite(l.precoHora)))
  return round2(finite(l.valorFixo))
}

function pecaValue(p: PecaLinha): number {
  return round2(finite(p.quantidade) * round2(finite(p.valorUnitario)))
}

export function calcBudget(state: BudgetState): BudgetTotals {
  const totalPecas = round2(state.pecas.reduce((acc, p) => acc + pecaValue(p), 0))
  const totalMaoDeObra = round2(state.maoDeObra.reduce((acc, l) => acc + laborValue(l), 0))
  return { totalPecas, totalMaoDeObra, total: round2(totalPecas + totalMaoDeObra) }
}

function formatHours(h: number): string {
  return roundHours(h).toLocaleString('pt-BR', { maximumFractionDigits: HOURS_DECIMALS, useGrouping: false })
}

export function encodeLaborDescricao(descricao: string, horas: number, precoHora: number): string {
  return `${descricao.trim()} — ${formatHours(horas)} h × ${formatBRL(precoHora)}/h`
}

export interface DecodedLabor {
  descricao: string
  horas: number
  precoHora: number
}

export function decodeLaborDescricao(descricao: string): DecodedLabor | null {
  const m = LABOR_SUFFIX.exec(descricao)
  if (!m) return null
  const horas = parseDecimalBR(m[2])
  const precoHora = parseDecimalBR(m[3])
  if (horas === null || precoHora === null) return null
  return { descricao: m[1], horas, precoHora }
}

export function encodeItens(state: BudgetState): ItemOrcamento[] {
  const pecas = state.pecas.map<ItemOrcamento>((p) => ({
    tipo: 'PECA',
    descricao: p.descricao.trim(),
    quantidade: Math.trunc(finite(p.quantidade)),
    valorUnitario: round2(finite(p.valorUnitario)),
  }))
  const maoDeObra = state.maoDeObra.map<ItemOrcamento>((l) => ({
    tipo: 'MAO_DE_OBRA',
    descricao: isHoursMode(l)
      ? encodeLaborDescricao(l.descricao, roundHours(l.horas), round2(l.precoHora))
      : l.descricao.trim(),
    quantidade: 1,
    valorUnitario: laborValue(l),
  }))
  return [...pecas, ...maoDeObra]
}

export function decodeItens(itens: readonly ItemOrcamento[], defaultPrecoHora: number): BudgetState {
  const pecas: PecaLinha[] = []
  const maoDeObra: MaoDeObraLinha[] = []
  for (const item of itens) {
    if (item.tipo === 'PECA') {
      pecas.push({
        key: newKey(),
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
      })
      continue
    }
    const decoded = decodeLaborDescricao(item.descricao)
    maoDeObra.push(
      decoded
        ? { key: newKey(), descricao: decoded.descricao, horas: decoded.horas, precoHora: decoded.precoHora, valorFixo: null }
        : {
            key: newKey(),
            descricao: item.descricao,
            horas: null,
            precoHora: defaultPrecoHora,
            valorFixo: round2(item.quantidade * item.valorUnitario),
          },
    )
  }
  return { pecas, maoDeObra }
}
