import { useState } from 'react'
import type { FormEvent } from 'react'
import { formatBRL, parseDecimalBR } from '../../shared/lib/money.ts'
import { setPrecoHora, usePrecoHora } from '../../shared/settings/precoHora.ts'
import { Button, Card, Field, Input, PageHeader, RequiredNote, useDirtyGuard, useToast } from '../../shared/ui'

function toInputText(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

export function ConfiguracoesPage() {
  const atual = usePrecoHora()
  const toast = useToast()
  const [texto, setTexto] = useState(() => toInputText(atual))
  const [error, setError] = useState<string | null>(null)

  const parsed = parseDecimalBR(texto)
  const isDirty = parsed === null || Math.round(parsed * 100) !== Math.round(atual * 100)
  const guard = useDirtyGuard(isDirty)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (parsed === null || parsed <= 0) {
      setError('Informe um valor maior que zero, como 120,00.')
      return
    }
    setError(null)
    guard.allowLeave()
    setPrecoHora(parsed)
    setTexto(toInputText(parsed))
    toast.success(`Preço da hora salvo: ${formatBRL(parsed)}.`)
  }

  return (
    <>
      <PageHeader title="Configurações" description="Ajustes usados pelo sistema neste computador." />

      <Card className="max-w-3xl">
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
          <RequiredNote />
          <div>
            <h2 className="text-2xl font-bold">Preço da hora (mão de obra)</h2>
            <p className="mt-1.5 text-base text-text-muted">
              O orçamento automático multiplica as horas de cada serviço por este valor para montar as linhas de mão
              de obra. Cada linha ainda pode receber um valor próprio no orçamento.
            </p>
          </div>

          <p className="text-base">
            Valor atual: <strong className="text-xl tabular-nums">{formatBRL(atual)}</strong> por hora
          </p>

          <Field label="Novo preço da hora (R$)" required error={error} className="sm:max-w-xs">
            <Input
              inputMode="decimal"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="120,00"
              autoComplete="off"
            />
          </Field>

          <p className="text-sm text-text-muted">
            Este valor fica salvo apenas neste navegador (armazenamento local do dispositivo). Em outro computador
            ou navegador, configure novamente.
          </p>

          <div className="flex justify-end border-t border-border pt-5">
            <Button type="submit" icon="check" disabled={!isDirty}>
              Salvar preço da hora
            </Button>
          </div>
        </form>
      </Card>
      {guard.dialog}
    </>
  )
}
