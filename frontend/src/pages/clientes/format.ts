export const onlyDigits = (value: string) => value.replace(/\D/g, '')

/** CPF (11 dígitos) ou CNPJ (14), formatado progressivamente enquanto o usuário digita. */
export function formatDocumento(value: string): string {
  const d = onlyDigits(value).slice(0, 14)
  if (d.length <= 11) {
    return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean).join('.') + (d.length > 9 ? `-${d.slice(9)}` : '')
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}${d.length > 12 ? `-${d.slice(12)}` : ''}`
}

/** Telefone brasileiro com DDD: (11) 1234-5678 ou (11) 91234-5678. */
export function formatTelefone(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (!d) return ''
  if (d.length <= 2) return `(${d}`
  const rest = d.slice(2)
  const cut = d.length > 10 ? 5 : 4
  if (rest.length <= cut) return `(${d.slice(0, 2)}) ${rest}`
  return `(${d.slice(0, 2)}) ${rest.slice(0, cut)}-${rest.slice(cut)}`
}

/** Dígitos do telefone sem o prefixo 55, se vier no formato internacional. */
export function telefoneDigits(value: string): string {
  const d = onlyDigits(value)
  return d.length > 11 && d.startsWith('55') ? d.slice(2) : d
}
