export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

/** Todos os termos (separados por espaço) precisam aparecer em algum dos campos. */
export function matchesQuery(query: string, ...fields: (string | undefined | null)[]): boolean {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = fields.map((f) => normalize(f ?? ''))
  return terms.every((t) => haystack.some((h) => h.includes(t)))
}

export function sortAlpha<T>(items: readonly T[], key: (item: T) => string): T[] {
  return [...items].sort((a, b) => key(a).localeCompare(key(b), 'pt-BR', { sensitivity: 'base' }))
}
