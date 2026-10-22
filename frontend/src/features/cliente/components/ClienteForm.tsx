import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Cliente, ClienteInput } from '../types'

interface ClienteFormProps {
  cliente?: Cliente | null
  isSaving: boolean
  onSubmit: (input: ClienteInput) => void
}

export function ClienteForm({ cliente, isSaving, onSubmit }: ClienteFormProps) {
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [documento, setDocumento] = useState(cliente?.documento ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [telefone, setTelefone] = useState(cliente?.telefone ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({ nome, documento, email, telefone })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label sm:col-span-2">
          Nome
          <input
            className="input mt-1"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            required
          />
        </label>
        <label className="field-label">
          Documento
          <input
            className="input mt-1"
            value={documento}
            onChange={(event) => setDocumento(event.target.value)}
            required
          />
          <span className="field-hint">CPF ou CNPJ do cliente</span>
        </label>
        <label className="field-label">
          Telefone
          <input
            type="tel"
            className="input mt-1"
            value={telefone}
            onChange={(event) => setTelefone(event.target.value)}
            required
          />
          <span className="field-hint">Usado para contato por WhatsApp</span>
        </label>
        <label className="field-label sm:col-span-2">
          E-mail
          <input
            type="email"
            className="input mt-1"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
      </div>
      <div className="form-footer">
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
        <Link to="/clientes" className="btn-secondary">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
