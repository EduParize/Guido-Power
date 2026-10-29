const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Arredonda para centavos (corrige 1.005 -> 1.01). Não finitos viram 0. */
export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0
  return (Math.sign(n) * Math.round(Math.abs(n) * 100 + 1e-7)) / 100
}

export function formatBRL(n: number): string {
  return brl.format(round2(n))
}

/**
 * "1.234,56" -> 1234.56; "1234.56" -> 1234.56; "R$ 10" -> 10; inválido/vazio -> null.
 * Sem vírgula, "1.234" (grupos de 3) é lido como milhar (1234), não como decimal.
 */
export function parseDecimalBR(text: string): number | null {
  const s = text.replace(/R\$/g, '').replace(/\s/g, '')
  if (!s) return null
  let normalized: string
  if (s.includes(',')) normalized = s.replace(/\./g, '').replace(',', '.')
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) normalized = s.replace(/\./g, '')
  else normalized = s
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}
