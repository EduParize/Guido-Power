import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Usuario, UsuarioUpdate } from '../types'

interface UsuarioFormProps {
  usuario?: Usuario | null
  isSaving: boolean
  onSubmit: (input: UsuarioUpdate) => void
}

export function UsuarioForm({ usuario, isSaving, onSubmit }: UsuarioFormProps) {
  const isEdicao = Boolean(usuario)
  const [nome, setNome] = useState(usuario?.nome ?? '')
  const [email, setEmail] = useState(usuario?.email ?? '')
  const [senha, setSenha] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({ nome, email, ...(senha && { senhaHash: senha }) })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          Nome
          <input
            className="input mt-1"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            required
          />
        </label>
        <label className="field-label">
          E-mail
          <input
            type="email"
            className="input mt-1"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="field-label sm:col-span-2">
          Senha
          <input
            type="password"
            className="input mt-1"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            autoComplete="new-password"
            required={!isEdicao}
          />
          {isEdicao && <span className="field-hint">Deixe em branco para manter a senha atual</span>}
        </label>
      </div>
      <div className="form-footer">
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
        <Link to="/usuarios" className="btn-secondary">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
