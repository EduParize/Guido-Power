import { useState } from 'react'
import type { FormEvent } from 'react'
import { clientesApi } from '../../shared/api/clientes.ts'
import { getErrorMessage } from '../../shared/api/http.ts'
import type { Cliente, Id, Orcamento, Veiculo } from '../../shared/api/types.ts'
import { veiculosApi } from '../../shared/api/veiculos.ts'
import { Alert, Button, Field, Input, Modal, RequiredNote, useToast } from '../../shared/ui'
import { ClienteCombobox } from '../../shared/ui/ClienteCombobox'
import { formatDocumento, onlyDigits } from '../clientes/format'
import { placaLabel, telefoneLabel } from './orcamentoUtils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_ANO = 1900

interface BaseProps {
  orcamento: Orcamento
  onClose: () => void
}

/** Resumo do que o backend copia do orçamento (somente leitura). */
function Herdado({ children }: { children: string }) {
  return <p className="rounded-lg bg-surface-muted px-4 py-3 text-base">{children}</p>
}

export function ClienteDoOrcamentoModal({ orcamento, onClose, onCreated }: BaseProps & { onCreated: (c: Cliente) => void }) {
  const toast = useToast()
  const [documento, setDocumento] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Partial<Record<'documento' | 'email', string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const doc = onlyDigits(documento)
    const found: typeof errors = {}
    if (!doc) found.documento = 'Informe o CPF ou CNPJ.'
    else if (doc.length !== 11 && doc.length !== 14) found.documento = 'O CPF tem 11 dígitos e o CNPJ tem 14.'
    if (!email.trim()) found.email = 'Informe o e-mail.'
    else if (!EMAIL_RE.test(email.trim())) found.email = 'Informe um e-mail válido, como nome@empresa.com.'
    setErrors(found)
    setSubmitError(null)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    try {
      const cliente = await clientesApi.createFromOrcamento({ orcamentoId: orcamento.id, documento: doc, email: email.trim() })
      toast.success('Cliente cadastrado')
      onCreated(cliente)
    } catch (e) {
      setSubmitError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Cadastrar cliente a partir do orçamento"
      description="Nome e telefone vêm do orçamento; informe os demais dados."
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="cliente-do-orcamento" isLoading={saving} icon="check">Cadastrar cliente</Button>
        </>
      }
    >
      <form id="cliente-do-orcamento" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <RequiredNote />
        <Herdado>{`${orcamento.nome ?? ''} · ${telefoneLabel(orcamento)}`}</Herdado>
        <Field label="CPF ou CNPJ" required error={errors.documento}>
          <Input value={documento} onChange={(e) => setDocumento(formatDocumento(e.target.value))} inputMode="numeric" autoComplete="off" data-autofocus />
        </Field>
        <Field label="E-mail" required error={errors.email}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </Field>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}
      </form>
    </Modal>
  )
}

export function VeiculoDoOrcamentoModal({
  orcamento,
  onClose,
  onCreated,
  clientes,
  veiculos,
  donoInicial,
}: BaseProps & { onCreated: (v: Veiculo) => void; clientes: Cliente[]; veiculos: Veiculo[]; donoInicial: Id | '' }) {
  const toast = useToast()
  const [dono, setDono] = useState<Id | ''>(donoInicial)
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [ano, setAno] = useState('')
  const [errors, setErrors] = useState<Partial<Record<'dono' | 'marca' | 'modelo' | 'ano', string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const found: typeof errors = {}
    const maxAno = new Date().getFullYear() + 1
    if (!dono) found.dono = 'Selecione o dono do veículo.'
    if (!marca.trim()) found.marca = 'Informe a marca.'
    if (!modelo.trim()) found.modelo = 'Informe o modelo.'
    if (!/^\d{4}$/.test(ano.trim())) found.ano = 'Informe o ano com 4 dígitos, por exemplo 2018.'
    else if (Number(ano) < MIN_ANO || Number(ano) > maxAno) found.ano = `O ano deve estar entre ${MIN_ANO} e ${maxAno}.`
    setErrors(found)
    setSubmitError(null)
    if (Object.keys(found).length > 0 || !dono) return
    setSaving(true)
    try {
      const veiculo = await veiculosApi.createFromOrcamento({
        orcamentoId: orcamento.id,
        dono,
        marca: marca.trim(),
        modelo: modelo.trim(),
        ano: ano.trim(),
      })
      toast.success('Veículo cadastrado')
      onCreated(veiculo)
    } catch (e) {
      setSubmitError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Cadastrar veículo a partir do orçamento"
      description="A placa vem do orçamento; informe o dono e os dados do veículo."
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="veiculo-do-orcamento" isLoading={saving} icon="check">Cadastrar veículo</Button>
        </>
      }
    >
      <form id="veiculo-do-orcamento" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <RequiredNote />
        <Herdado>{`Placa ${placaLabel(orcamento)}`}</Herdado>
        <ClienteCombobox label="Dono" value={dono} onChange={(id) => setDono(id)} clientes={clientes} veiculos={veiculos} required error={errors.dono} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Marca" required error={errors.marca}>
            <Input value={marca} onChange={(e) => setMarca(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Modelo" required error={errors.modelo}>
            <Input value={modelo} onChange={(e) => setModelo(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Ano" required error={errors.ano}>
            <Input value={ano} onChange={(e) => setAno(onlyDigits(e.target.value).slice(0, 4))} inputMode="numeric" autoComplete="off" />
          </Field>
        </div>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}
      </form>
    </Modal>
  )
}
