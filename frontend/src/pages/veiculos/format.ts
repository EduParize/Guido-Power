/** Placa como o backend guarda: maiúscula, sem hífen nem espaço. */
export const normalizePlaca = (value: string) => value.replace(/[\s-]/g, '').toUpperCase()

/** ABC1234 (modelo antigo) vira ABC-1234; o padrão Mercosul (ABC1D23) fica como está. */
export function formatPlaca(value: string): string {
  const p = normalizePlaca(value)
  return /^[A-Z]{3}\d{4}$/.test(p) ? `${p.slice(0, 3)}-${p.slice(3)}` : p
}

/** ABC1234 ou ABC1D23. */
export const isPlacaValida = (value: string) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(normalizePlaca(value))
