import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../shared/api/http.ts'
import type { Usuario, UsuarioInput, UsuarioUpdate } from '../../shared/api/types.ts'
import { usuariosApi } from '../../shared/api/usuarios.ts'
import { roleForEmail } from '../../shared/auth'
import { sha256Hex } from '../../shared/lib/crypto.ts'
import { useResource } from '../../shared/lib/useResource.ts'
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  LoadingState,
  PageHeader,
  RequiredNote,
  useDirtyGuard,
  useToast,
} from '../../shared/ui'

const MIN_SENHA = 6
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DUPLICATE_RE = /e-?mail|duplicad|j[áa] (existe|cadastrad|em uso)|unique/i

interface FormErrors {
  nome?: string
  email?: string
  senha?: string
  confirmar?: string
}

/** Rota única para `usuarios/novo` e `usuarios/:id`. */
export function UsuarioFormPage() {
  const { id } = useParams()
  if (!id) return <UsuarioForm initial={null} />
  return <UsuarioEditLoader id={id} />
}

function UsuarioEditLoader({ id }: { id: string }) {
  const { data, error, isLoading, reload } = useResource((signal) => usuariosApi.get(id, signal), [id])
  if (data) return <UsuarioForm key={data.id} initial={data} />
  return (
    <>
      <PageHeader title="Editar usuário" />
      {isLoading ? (
        <Card>
          <LoadingState label="Carregando usuário…" />
        </Card>
      ) : (
        <Alert
          tone="danger"
          title="Não foi possível carregar o usuário"
          action={
            <Button size="sm" variant="secondary" onClick={reload}>
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      )}
    </>
  )
}

function validate(values: { nome: string; email: string; senha: string; confirmar: string }, isEdit: boolean) {
  const errors: FormErrors = {}
  if (!values.nome.trim()) errors.nome = 'Informe o nome.'
  if (!values.email.trim()) errors.email = 'Informe o e-mail.'
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Informe um e-mail válido, como nome@empresa.com.'

  const wantsPassword = !isEdit || values.senha !== '' || values.confirmar !== ''
  if (wantsPassword) {
    if (!values.senha) errors.senha = 'Informe a senha.'
    else if (values.senha.length < MIN_SENHA) errors.senha = `A senha precisa ter pelo menos ${MIN_SENHA} caracteres.`
    if (!values.confirmar) errors.confirmar = 'Repita a senha.'
    else if (values.confirmar !== values.senha) errors.confirmar = 'As senhas não são iguais.'
  }
  return errors
}

function UsuarioForm({ initial }: { initial: Usuario | null }) {
  const isEdit = initial !== null
  const navigate = useNavigate()
  const toast = useToast()
  const [nome, setNome] = useState(initial?.nome ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = isEdit
    ? nome !== initial.nome || email !== initial.email || senha !== '' || confirmar !== ''
    : nome !== '' || email !== '' || senha !== '' || confirmar !== ''
  const guard = useDirtyGuard(isDirty)

  const emailTrim = email.trim()
  const role = EMAIL_RE.test(emailTrim) ? roleForEmail(emailTrim) : null

  function leave() {
    guard.allowLeave()
    navigate('/usuarios')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    const found = validate({ nome, email, senha, confirmar }, isEdit)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const changes: UsuarioUpdate = {}
    if (!isEdit || nome.trim() !== initial.nome) changes.nome = nome.trim()
    if (!isEdit || emailTrim !== initial.email) changes.email = emailTrim

    if (isEdit && Object.keys(changes).length === 0 && senha === '') {
      toast.info('Nenhuma alteração para salvar.')
      leave()
      return
    }

    setIsSaving(true)
    try {
      if (senha) changes.senhaHash = await sha256Hex(senha)
      if (isEdit) await usuariosApi.update(initial.id, changes)
      else await usuariosApi.create(changes as UsuarioInput)
      toast.success(isEdit ? 'Usuário atualizado.' : 'Usuário cadastrado.')
      leave()
    } catch (err) {
      const message = getErrorMessage(err)
      const isConflict = err instanceof ApiError && (err.status === 409 || err.status === 400)
      if (isConflict && DUPLICATE_RE.test(message)) setErrors({ email: 'Já existe um usuário com este e-mail.' })
      else setSubmitError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Editar usuário' : 'Novo usuário'}
        description={isEdit ? initial.nome : 'Cadastre uma pessoa da equipe e defina a senha de acesso.'}
      />

      <Card className="max-w-3xl">
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
          <RequiredNote />

          {submitError ? (
            <Alert tone="danger" title="Não foi possível salvar">
              {submitError}
            </Alert>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nome" required error={errors.nome}>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" autoFocus />
            </Field>
            <Field label="E-mail" required error={errors.email}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-surface-muted px-4 py-3 text-[15px]">
            <span className="font-semibold">Perfil</span>
            {role === 'admin' ? <Badge tone="violet">Administrador</Badge> : null}
            {role === 'atendente' ? <Badge tone="neutral">Atendente</Badge> : null}
            <span className="text-text-muted">
              Perfil é definido pela lista VITE_ADMIN_EMAILS, não por este formulário.
            </span>
          </div>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 text-lg font-bold">{isEdit ? 'Trocar senha' : 'Senha de acesso'}</legend>
            {isEdit ? (
              <p className="-mt-2 text-[15px] text-text-muted">Deixe em branco para manter a senha atual.</p>
            ) : null}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={isEdit ? 'Nova senha' : 'Senha'}
                required={!isEdit}
                error={errors.senha}
                hint={`Mínimo de ${MIN_SENHA} caracteres.`}
              >
                <Input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirmar senha" required={!isEdit} error={errors.confirmar}>
                <Input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
            </div>
          </fieldset>

          <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
            <Button variant="secondary" onClick={() => guard.confirmLeave(leave)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" icon="check" isLoading={isSaving}>
              {isEdit ? 'Salvar alterações' : 'Cadastrar usuário'}
            </Button>
          </div>
        </form>
      </Card>
      {guard.dialog}
    </>
  )
}
