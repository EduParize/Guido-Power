// Rodar: node --experimental-strip-types frontend/src/shared/lib/crypto.check.ts
import { sha256Hex, sha256HexFallback } from './crypto.ts'

// Sem node:assert: o projeto não tem @types/node (tsc -p tsconfig.app.json inclui este arquivo).
const assert = {
  equal(actual: unknown, expected: unknown) {
    if (actual !== expected) throw new Error(`esperado ${String(expected)}, obtido ${String(actual)}`)
  },
}

assert.equal(sha256HexFallback(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
assert.equal(sha256HexFallback('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')

// Multi-bloco (> 64 bytes), limite de padding (55/56/64 bytes) e não-ASCII, contra o crypto.subtle.
const cases = ['a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'Senha@Ação-ÇÃO-日本語-😀 '.repeat(20)]
for (const text of cases) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  const expected = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  assert.equal(sha256HexFallback(text), expected)
  assert.equal(await sha256Hex(text), expected)
}

console.log('crypto.check ok')
