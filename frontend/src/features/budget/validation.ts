import type { BudgetState, MaoDeObraLinha, PecaLinha } from '../../shared/lib/budget.ts'

export interface PecaErrors {
  descricao?: string
  quantidade?: string
  valorUnitario?: string
}
export interface MaoDeObraErrors {
  descricao?: string
  horas?: string
  precoHora?: string
  valorFixo?: string
}
export interface BudgetErrors {
  pecas: Record<string, PecaErrors>
  maoDeObra: Record<string, MaoDeObraErrors>
}

export const NO_BUDGET_ERRORS: BudgetErrors = { pecas: {}, maoDeObra: {} }

function isMoney(n: number | null): boolean {
  if (n === null || !Number.isFinite(n) || n < 0) return false
  const cents = n * 100
  return Math.abs(cents - Math.round(cents)) < 1e-6
}

function moneyError(n: number | null): string | undefined {
  if (n === null || !Number.isFinite(n)) return 'Informe um valor válido'
  if (n < 0) return 'O valor não pode ser negativo'
  return isMoney(n) ? undefined : 'Use no máximo 2 casas decimais'
}

function validatePeca(p: PecaLinha): PecaErrors {
  const e: PecaErrors = {}
  if (!p.descricao.trim()) e.descricao = 'Informe a descrição da peça'
  if (!Number.isInteger(p.quantidade) || p.quantidade < 1) e.quantidade = 'Mínimo 1, sem casas decimais'
  const v = moneyError(p.valorUnitario)
  if (v) e.valorUnitario = v
  return e
}

function validateMaoDeObra(l: MaoDeObraLinha): MaoDeObraErrors {
  const e: MaoDeObraErrors = {}
  if (!l.descricao.trim()) e.descricao = 'Informe a descrição do serviço'
  if (l.horas !== null && l.precoHora !== null) {
    if (!Number.isFinite(l.horas) || l.horas <= 0) e.horas = 'Informe horas maiores que zero'
    const p = moneyError(l.precoHora)
    if (p) e.precoHora = p
    return e
  }
  const f = moneyError(l.valorFixo ?? 0)
  if (f) e.valorFixo = f
  return e
}

function nonEmpty<T extends object>(map: Record<string, T>, key: string, errors: T) {
  if (Object.keys(errors).length > 0) map[key] = errors
}

export function validateBudget(state: BudgetState): BudgetErrors {
  const pecas: Record<string, PecaErrors> = {}
  const maoDeObra: Record<string, MaoDeObraErrors> = {}
  for (const p of state.pecas) nonEmpty(pecas, p.key, validatePeca(p))
  for (const l of state.maoDeObra) nonEmpty(maoDeObra, l.key, validateMaoDeObra(l))

  return { pecas, maoDeObra }
}

export function hasBudgetErrors(e: BudgetErrors): boolean {
  return Object.keys(e.pecas).length > 0 || Object.keys(e.maoDeObra).length > 0
}
