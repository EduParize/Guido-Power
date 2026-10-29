// Rodar: node --experimental-strip-types frontend/src/features/budget/catalog.check.ts
import type { Orcamento } from '../../shared/api/types.ts'
import type { BudgetState } from '../../shared/lib/budget.ts'
import { deriveCatalogs } from './catalog.ts'
import { hasBudgetErrors, validateBudget } from './validation.ts'

// Sem node:assert: o projeto não tem @types/node no tsconfig do app (mesmo estilo de budget.check.ts).
const assert = {
  equal(actual: unknown, expected: unknown) {
    if (actual !== expected) throw new Error(`esperado ${String(expected)}, obtido ${String(actual)}`)
  },
  deepEqual(actual: unknown, expected: unknown) {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error(`esperado ${JSON.stringify(expected)}, obtido ${JSON.stringify(actual)}`)
  },
}

function orc(id: string, day: number, itens: Orcamento['itens']): Orcamento {
  const data = `2026-10-${String(day).padStart(2, '0')}T12:00:00.000Z`
  return { id, nome: null, telefone: null, placa: null, decisao: 'PENDENTE', decisaoData: data, valor: 0, itens }
}

// catálogo: dedupe sem acento/caixa, último valor vence (por data, não por ordem do array), A–Z, usos por orçamento
const orcamentos = [
  orc('b', 20, [
    { tipo: 'PECA', descricao: 'Filtro de Óleo', quantidade: 1, valorUnitario: 35 },
    { tipo: 'PECA', descricao: 'filtro de oleo ', quantidade: 1, valorUnitario: 36 },
    { tipo: 'MAO_DE_OBRA', descricao: 'Troca — 2 h × R$ 150,00/h', quantidade: 1, valorUnitario: 300 },
  ]),
  orc('a', 10, [
    { tipo: 'PECA', descricao: 'Filtro de óleo', quantidade: 1, valorUnitario: 30 },
    { tipo: 'PECA', descricao: 'Amortecedor', quantidade: 2, valorUnitario: 200 },
    { tipo: 'MAO_DE_OBRA', descricao: 'Alinhamento', quantidade: 2, valorUnitario: 40.1 },
  ]),
]
const { parts, labor } = deriveCatalogs(orcamentos)
assert.deepEqual(parts.map((p) => p.descricao), ['Amortecedor', 'filtro de oleo'])
assert.equal(parts[1].valorUnitario, 36)
assert.equal(parts[1].usos, 2)
assert.deepEqual(
  labor.map((l) => [l.descricao, l.valorUnitario, l.porHora]),
  [['Alinhamento', 80.2, false], ['Troca', 150, true]],
)
assert.equal(deriveCatalogs([]).parts.length, 0)

// validação
const valido: BudgetState = {
  pecas: [{ key: 'p1', descricao: 'Filtro', quantidade: 2, valorUnitario: 19.99 }],
  maoDeObra: [{ key: 'm1', descricao: 'Troca', horas: 1.5, precoHora: 120, valorFixo: null }],
}
assert.equal(hasBudgetErrors(validateBudget(valido)), false)

const ruim = validateBudget({
  pecas: [{ key: 'p1', descricao: ' ', quantidade: 1.5, valorUnitario: 10.999 }],
  maoDeObra: [
    { key: 'm1', descricao: '', horas: 0, precoHora: -1, valorFixo: null },
    { key: 'm2', descricao: 'Fixo', horas: null, precoHora: 120, valorFixo: Number.NaN },
  ],
})
assert.deepEqual(Object.keys(ruim.pecas.p1), ['descricao', 'quantidade', 'valorUnitario'])
assert.deepEqual(Object.keys(ruim.maoDeObra.m1), ['descricao', 'horas', 'precoHora'])
assert.deepEqual(Object.keys(ruim.maoDeObra.m2), ['valorFixo'])
assert.equal(hasBudgetErrors(validateBudget({ pecas: [], maoDeObra: [] })), false)
