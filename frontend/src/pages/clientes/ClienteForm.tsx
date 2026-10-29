import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientesApi } from '../../shared/api/clientes.ts'
import { ApiError, getErrorMessage } from '../../shared/api/http.ts'
import type { Cliente } from '../../shared/api/types.ts'
import { Alert, Button, Card, Field, Input, RequiredNote, useDirtyGuard, useToast } from '../../shared/ui'
import { formatDocumento, formatTelefone, onlyDigits, telefoneDigits } from './format'

interface Values {
  nome: string
  documento: string
  email: string
  telefone: string
}
type Errors = Partial<Record<keyof Values, string>>

const EMPTY: Values = { nome: '', documento: '', email: '', telefone: '' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const fromCliente = (c: Cliente): Values => ({
  nome: c.nome,
  documento: formatDocumento(c.documento),
  email: c.email,
  telefone: formatTelefone(telefoneDigits(c.telefone)),
})

/** Valores como serão enviados: documento e telefone só com dígitos. */
const toInput = (v: Values) => ({
  nome: v.nome.trim(),
  documento: onlyDigits(v.documento),
  email: v.email.trim(),
  telefone: onlyDigits(v.telefone),
})
const snapshot = (v: Values) => JSON.stringify(toInput(v))

function validate(v: Values): Errors {
  const errors: Errors = {}
  const doc = onlyDigits(v.documento)
  const tel = onlyDigits(v.telefone)
  if (!v.nome.trim()) errors.nome = 'Informe o nome do cliente.'
  if (!doc) errors.documento = 'Informe o CPF ou CNPJ.'
  else if (doc.length !== 11 && doc.length !== 14) errors.documento = 'O CPF tem 11 dígitos e o CNPJ tem 14.'
  if (!v.email.trim()) errors.email = 'Informe o e-mail.'
  else if (!EMAIL_RE.test(v.email.trim())) errors.email = 'Informe um e-mail válido, como nome@empresa.com.'
  if (!tel) errors.telefone = 'Informe o telefone.'
  else if (tel.length < 10) errors.telefone = 'Informe o telefone com DDD, por exemplo (11) 91234-5678.'
  return errors
}

export interface ClienteFormProps {
  /** Cliente em edição; omitido no cadastro. */
  initial?: Cliente
  onSaved: (cliente: Cliente) => void
  /** Destino do botão Cancelar. */
  cancelTo: string
}

export function ClienteForm({ initial, onSaved, cancelTo }: ClienteFormProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const [baseline, setBaseline] = useState(() => (initial ? fromCliente(initial) : EMPTY))
  const [values, setValues] = useState<Values>(baseline)
  const [errors, setErrors] = useState<Errors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const guard = useDirtyGuard(snapshot(values) !== snapshot(baseline))

  function set<K extends keyof Values>(key: K, value: string) {
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
      const input = toInput(values)
      const saved = initial ? await clientesApi.update(initial.id, input) : await clientesApi.create(input)
      toast.success(initial ? 'Cliente atualizado.' : 'Cliente cadastrado.')
      guard.allowLeave()
      setBaseline(values)
      onSaved(saved)
    } catch (err) {
      const message = getErrorMessage(err)
      if (err instanceof ApiError && err.status === 409 && /documento/i.test(message)) {
        setErrors({ documento: message })
      } else if (err instanceof ApiError && err.status === 409 && /e-mail/i.test(message)) {
        setErrors({ email: message })
      } else {
        setSubmitError(message)
      }
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-4xl">
      <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <RequiredNote />
        {submitError ? <Alert tone="danger" title="Não foi possível salvar o cliente">{submitError}</Alert> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome" required error={errors.nome} className="sm:col-span-2">
            <Input value={values.nome} onChange={(e) => set('nome', e.target.value)} autoComplete="off" />
          </Field>
          <Field label="CPF ou CNPJ" required error={errors.documento} hint="Somente números; a máscara é aplicada ao digitar.">
            <Input
              inputMode="numeric"
              value={values.documento}
              onChange={(e) => set('documento', formatDocumento(e.target.value))}
              autoComplete="off"
            />
          </Field>
          <Field label="Telefone" required error={errors.telefone} hint="Com DDD. Usado para avisos por WhatsApp.">
            <Input
              type="tel"
              inputMode="tel"
              value={values.telefone}
              onChange={(e) => set('telefone', formatTelefone(telefoneDigits(e.target.value)))}
              autoComplete="off"
            />
          </Field>
          <Field label="E-mail" required error={errors.email} className="sm:col-span-2">
            <Input type="email" value={values.email} onChange={(e) => set('email', e.target.value)} autoComplete="off" />
          </Field>
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
          <Button variant="secondary" onClick={() => guard.confirmLeave(() => navigate(cancelTo))}>
            Cancelar
          </Button>
          <Button type="submit" icon="check" isLoading={saving}>
            {initial ? 'Salvar alterações' : 'Cadastrar cliente'}
          </Button>
        </div>
      </form>
      {guard.dialog}
    </Card>
  )
}
