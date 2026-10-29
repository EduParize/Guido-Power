import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../shared/api/http.ts'
import type { Id, Veiculo } from '../../shared/api/types.ts'
import { veiculosApi } from '../../shared/api/veiculos.ts'
import { Alert, Button, Card, Field, Input, RequiredNote, useDirtyGuard, useToast } from '../../shared/ui'
import { ClienteCombobox } from '../../shared/ui/ClienteCombobox'
import { formatPlaca, isPlacaValida, normalizePlaca } from './format'

interface Values {
  modelo: string
  ano: string
  marca: string
  placa: string
  dono: Id | ''
}
type Errors = Partial<Record<keyof Values, string>>

const MIN_ANO = 1900

const toInput = (v: Values) => ({
  modelo: v.modelo.trim(),
  ano: v.ano.trim(),
  marca: v.marca.trim(),
  placa: normalizePlaca(v.placa),
  dono: v.dono,
})
const snapshot = (v: Values) => JSON.stringify(toInput(v))

function validate(v: Values): Errors {
  const errors: Errors = {}
  const maxAno = new Date().getFullYear() + 1
  if (!v.marca.trim()) errors.marca = 'Informe a marca.'
  if (!v.modelo.trim()) errors.modelo = 'Informe o modelo.'
  if (!/^\d{4}$/.test(v.ano.trim())) errors.ano = 'Informe o ano com 4 dígitos, por exemplo 2018.'
  else if (Number(v.ano) < MIN_ANO || Number(v.ano) > maxAno) errors.ano = `O ano deve estar entre ${MIN_ANO} e ${maxAno}.`
  if (!normalizePlaca(v.placa)) errors.placa = 'Informe a placa.'
  else if (!isPlacaValida(v.placa)) errors.placa = 'Placa inválida. Use ABC1234 ou ABC1D23.'
  if (!v.dono) errors.dono = 'Selecione o dono do veículo.'
  return errors
}

export interface VeiculoFormProps {
  /** Veículo em edição; omitido no cadastro. */
  initial?: Veiculo
  /** Dono pré-selecionado no cadastro (ex.: vindo da página do cliente). */
  clienteId?: Id
  onSaved: (veiculo: Veiculo) => void
  /** Destino do botão Cancelar. */
  cancelTo: string
}

export function VeiculoForm({ initial, clienteId, onSaved, cancelTo }: VeiculoFormProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const [baseline, setBaseline] = useState<Values>(() =>
    initial
      ? { modelo: initial.modelo, ano: initial.ano, marca: initial.marca, placa: formatPlaca(initial.placa), dono: initial.dono }
      : { modelo: '', ano: '', marca: '', placa: '', dono: clienteId ?? '' },
  )
  const [values, setValues] = useState<Values>(baseline)
  const [errors, setErrors] = useState<Errors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const guard = useDirtyGuard(snapshot(values) !== snapshot(baseline))

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    setSubmitError(null)
    if (Object.keys(found).length > 0) {
      setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    setSaving(true)
    try {
      const input = { ...toInput(values), dono: values.dono as Id }
      const saved = initial ? await veiculosApi.update(initial.id, input) : await veiculosApi.create(input)
      toast.success(initial ? 'Veículo atualizado.' : 'Veículo cadastrado.')
      guard.allowLeave()
      setBaseline(values)
      onSaved(saved)
    } catch (err) {
      const message = getErrorMessage(err)
      if (err instanceof ApiError && err.status === 409 && /placa/i.test(message)) setErrors({ placa: message })
      else setSubmitError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-4xl">
      <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <RequiredNote />
        {submitError ? <Alert tone="danger" title="Não foi possível salvar o veículo">{submitError}</Alert> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Placa" required error={errors.placa} hint="ABC1234 ou ABC1D23 (Mercosul).">
            <Input
              value={values.placa}
              onChange={(e) => set('placa', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 8))}
              autoComplete="off"
              className="font-mono tracking-widest uppercase"
            />
          </Field>
          <Field label="Ano" required error={errors.ano}>
            <Input
              inputMode="numeric"
              maxLength={4}
              value={values.ano}
              onChange={(e) => set('ano', e.target.value.replace(/\D/g, ''))}
              autoComplete="off"
            />
          </Field>
          <Field label="Marca" required error={errors.marca}>
            <Input value={values.marca} onChange={(e) => set('marca', e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Modelo" required error={errors.modelo}>
            <Input value={values.modelo} onChange={(e) => set('modelo', e.target.value)} autoComplete="off" />
          </Field>
          <div className="sm:col-span-2">
            <ClienteCombobox label="Dono (cliente)" required value={values.dono} error={errors.dono} onChange={(id) => set('dono', id)} />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
          <Button variant="secondary" onClick={() => guard.confirmLeave(() => navigate(cancelTo))}>
            Cancelar
          </Button>
          <Button type="submit" icon="check" isLoading={saving}>
            {initial ? 'Salvar alterações' : 'Cadastrar veículo'}
          </Button>
        </div>
      </form>
      {guard.dialog}
    </Card>
  )
}
