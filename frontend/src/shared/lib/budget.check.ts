// Rodar: node --experimental-strip-types frontend/src/shared/lib/budget.check.ts
import {
  calcBudget,
  decodeItens,
  decodeLaborDescricao,
  encodeItens,
  encodeLaborDescricao,
  laborValue,
  type BudgetState,
} from './budget.ts'
import { parseDecimalBR, round2 } from './money.ts'

const NBSP = ' '

// Sem node:assert: o projeto não tem @types/node (tsc -p tsconfig.app.json inclui este arquivo).
const assert = {
  equal(actual: unknown, expected: unknown) {
    if (actual !== expected) throw new Error(`esperado ${String(expected)}, obtido ${String(actual)}`)
  },
  deepEqual(actual: unknown, expected: unknown) {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error(`esperado ${JSON.stringify(expected)}, obtido ${JSON.stringify(actual)}`)
  },
}

// money
assert.equal(round2(1.005), 1.01)
assert.equal(round2(19.99 * 3), 59.97)
assert.equal(parseDecimalBR('1.234,56'), 1234.56)
assert.equal(parseDecimalBR('1234.56'), 1234.56)
assert.equal(parseDecimalBR('R$ 10'), 10)
assert.equal(parseDecimalBR('abc'), null)
assert.equal(parseDecimalBR(''), null)

// totais: o backend soma quantidade × valorUnitario (em centavos) dos itens
const base: BudgetState = {
  pecas: [
    { key: 'a', descricao: 'Filtro', quantidade: 2, valorUnitario: 19.99 },
    { key: 'b', descricao: 'Óleo', quantidade: 1, valorUnitario: 50.5 },
  ],
  maoDeObra: [
    { key: 'c', descricao: 'Troca', horas: 2.5, precoHora: 120, valorFixo: null },
    { key: 'd', descricao: 'Diagnóstico', horas: null, precoHora: 120, valorFixo: 80 },
  ],
}
assert.deepEqual(calcBudget(base), { totalPecas: 90.48, totalMaoDeObra: 380, total: 470.48 })
assert.deepEqual(calcBudget({ pecas: [], maoDeObra: [] }), { totalPecas: 0, totalMaoDeObra: 0, total: 0 })

// mão de obra: formatação pt-BR e round-trip
assert.equal(encodeLaborDescricao('Troca', 2.5, 120), `Troca — 2,5 h × R$${NBSP}120,00/h`)
assert.deepEqual(decodeLaborDescricao(encodeLaborDescricao('Troca — de correia', 0.25, 1234.5)), {
  descricao: 'Troca — de correia',
  horas: 0.25,
  precoHora: 1234.5,
})
assert.equal(laborValue({ key: 'x', descricao: '', horas: 1.333, precoHora: 99.99, valorFixo: null }), 133.29)

const itens = encodeItens(base)
assert.equal(itens.length, 4)
assert.deepEqual(itens[0], { tipo: 'PECA', descricao: 'Filtro', quantidade: 2, valorUnitario: 19.99 })
assert.equal(itens[2].tipo, 'MAO_DE_OBRA')
assert.equal(itens[2].quantidade, 1)
assert.equal(itens[2].valorUnitario, 300)
assert.equal(itens[3].descricao, 'Diagnóstico') // modo fixo: sem marcador

// o total do editor é o que o backend calcula a partir dos itens enviados
const totalBackend = round2(itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0))
assert.equal(totalBackend, calcBudget(base).total)

const decoded = decodeItens(itens, 150)
assert.deepEqual(
  decoded.maoDeObra.map(({ descricao, horas, precoHora, valorFixo }) => ({ descricao, horas, precoHora, valorFixo })),
  [
    { descricao: 'Troca', horas: 2.5, precoHora: 120, valorFixo: null },
    { descricao: 'Diagnóstico', horas: null, precoHora: 150, valorFixo: 80 },
  ],
)
assert.deepEqual(encodeItens(decoded), itens) // lossless

// mão de obra sem marcador, quantidade > 1 -> valor fixo
const legacy = decodeItens([{ tipo: 'MAO_DE_OBRA', descricao: 'Alinhamento', quantidade: 2, valorUnitario: 40.1 }], 100)
assert.equal(legacy.maoDeObra[0].horas, null)
assert.equal(legacy.maoDeObra[0].valorFixo, 80.2)
assert.equal(calcBudget(legacy).total, 80.2)

console.warn('budget.check: ok')
