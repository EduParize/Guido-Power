import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { usuariosApi } from '../../shared/api/usuarios.ts'
import { getErrorMessage } from '../../shared/api/http.ts'
import { sha256Hex } from '../../shared/lib/crypto.ts'
import { useResource } from '../../shared/lib/useResource.ts'
import { useAuth } from '../../shared/auth'
import { getAdminEmails } from '../../shared/auth/roles'
import { Alert, Button, Field, Input, LoadingState, RequiredNote } from '../../shared/ui'
import { PasswordInput } from './PasswordInput'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function fromState(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/'
}

export function LoginPage() {
  const { user } = useAuth()
  const location = useLocation()
  const from = fromState(location.state)
  const usuarios = useResource((signal) => usuariosApi.list(signal), [])

  if (user) return <Navigate to={from} replace />

  const noUsers = usuarios.data !== undefined && usuarios.data.length === 0

  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <BrandPanel />
      <main id="conteudo" className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-text">{noUsers ? 'Criar primeiro administrador' : 'Entrar'}</h1>
          <p className="mt-1.5 mb-6 text-base text-text-muted">
            {noUsers
              ? 'Ainda não há usuários cadastrados. Crie a conta que vai administrar o sistema.'
              : 'Use o e-mail e a senha cadastrados na oficina.'}
          </p>
          <div className="rounded-lg border border-border bg-surface p-5 shadow-card sm:p-7">
            {usuarios.isLoading && !usuarios.data ? (
              <LoadingState label="Conectando ao servidor…" className="py-10" />
            ) : usuarios.error && !usuarios.data ? (
              <Alert
                tone="danger"
                title="Não foi possível conectar"
                action={<Button size="sm" variant="secondary" onClick={usuarios.reload}>Tentar novamente</Button>}
              >
                {usuarios.error}
              </Alert>
            ) : noUsers ? (
              <FirstAdminForm onCreated={usuarios.reload} />
            ) : (
              <LoginForm />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function BrandPanel() {
  return (
    <aside className="side-scope relative flex flex-col justify-between gap-8 overflow-hidden bg-side-bg px-6 py-8 text-side-text sm:px-10 lg:min-h-dvh lg:py-12">
      <div className="checker absolute top-0 left-0 w-full" aria-hidden="true" />
      <div className="mt-4">
        <img src="/logo.png" alt="Guido Power" className="logo-blend h-auto w-44 sm:w-56 lg:w-72" />
      </div>
      <div className="hidden lg:block">
        <p className="font-display text-4xl leading-tight font-bold">
          Ordens de serviço, orçamentos e clientes num só lugar.
        </p>
        <p className="mt-4 max-w-md text-lg text-side-muted">
          Acompanhe cada veículo da entrada à entrega e mantenha o cliente informado a cada mudança de status.
        </p>
      </div>
    </aside>
  )
}

function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [errors, setErrors] = useState<{ email?: string; senha?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next = {
      email: !email.trim() ? 'Informe o e-mail' : !EMAIL_RE.test(email.trim()) ? 'Informe um e-mail válido' : undefined,
      senha: !senha ? 'Informe a senha' : undefined,
    }
    setErrors(next)
    setFormError(null)
    if (next.email || next.senha) return
    setBusy(true)
    try {
      await login(email, senha)
    } catch (err) {
      setFormError(getErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <RequiredNote />
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <Field label="E-mail" required error={errors.email}>
        <Input type="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Senha" required error={errors.senha}>
        <PasswordInput autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
      </Field>
      <Button type="submit" isLoading={busy} className="w-full">
        {busy ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

function FirstAdminForm({ onCreated }: { onCreated: () => void }) {
  const { login } = useAuth()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const adminEmails = getAdminEmails()
  const isListed = adminEmails.includes(email.trim().toLowerCase())

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next = {
      nome: nome.trim() ? undefined : 'Informe o nome',
      email: !email.trim() ? 'Informe o e-mail' : !EMAIL_RE.test(email.trim()) ? 'Informe um e-mail válido' : undefined,
      senha: senha ? undefined : 'Informe a senha',
      confirmar: !confirmar ? 'Repita a senha' : confirmar !== senha ? 'As senhas não são iguais' : undefined,
    }
    setErrors(next)
    setFormError(null)
    if (Object.values(next).some(Boolean)) return
    setBusy(true)
    try {
      await usuariosApi.create({ nome: nome.trim(), email: email.trim(), senhaHash: await sha256Hex(senha) })
      // O administrador já existe: se o login falhar, recarregar a lista leva à tela de login normal.
      try {
        await login(email, senha)
      } catch (err) {
        onCreated()
        throw err
      }
    } catch (err) {
      setFormError(getErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <RequiredNote />
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <Field label="Nome" required error={errors.nome}>
        <Input autoComplete="name" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} />
      </Field>
      <Field label="E-mail" required error={errors.email}>
        <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Senha" required error={errors.senha}>
        <PasswordInput autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
      </Field>
      <Field label="Confirmar senha" required error={errors.confirmar}>
        <PasswordInput autoComplete="new-password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
      </Field>
      <Alert tone={isListed || !email.trim() ? 'info' : 'warning'}>
        O papel de administrador é definido pela variável <code className="font-semibold">VITE_ADMIN_EMAILS</code>.
        {adminEmails.length === 0
          ? ' Ela está vazia: inclua este e-mail nela e reinicie o frontend, ou você entrará como atendente.'
          : isListed
            ? ' Este e-mail está na lista.'
            : ' Este e-mail não está na lista e entrará como atendente.'}
      </Alert>
      <Button type="submit" isLoading={busy} className="w-full">
        {busy ? 'Criando…' : 'Criar administrador e entrar'}
      </Button>
    </form>
  )
}
