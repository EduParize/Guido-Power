import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usuariosApi } from '../../shared/api/usuarios.ts'
import { getErrorMessage } from '../../shared/api/http.ts'
import type { Usuario } from '../../shared/api/types.ts'
import { roleForEmail, useAuth } from '../../shared/auth'
import { matchesQuery, sortAlpha } from '../../shared/lib/search.ts'
import { useResource } from '../../shared/lib/useResource.ts'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  IconButton,
  LinkButton,
  LoadingState,
  PageHeader,
  SearchInput,
  useToast,
} from '../../shared/ui'
import type { DataColumn } from '../../shared/ui'

export function UsuariosPage() {
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, error, isLoading, reload } = useResource((signal) => usuariosApi.list(signal), [])
  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState<Usuario | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const rows = sortAlpha(
    (data ?? []).filter((u) => matchesQuery(query, u.nome, u.email)),
    (u) => u.nome,
  )

  async function confirmDelete() {
    if (!toDelete) return
    setIsDeleting(true)
    try {
      await usuariosApi.remove(toDelete.id)
      toast.success(`Usuário ${toDelete.nome} excluído.`)
      setToDelete(null)
      reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: DataColumn<Usuario>[] = [
    { key: 'nome', header: 'Nome', cell: (u) => <span className="font-semibold">{u.nome}</span> },
    { key: 'email', header: 'E-mail', cell: (u) => u.email },
    {
      key: 'perfil',
      header: 'Perfil',
      cell: (u) =>
        roleForEmail(u.email) === 'admin' ? (
          <Badge tone="violet">Administrador</Badge>
        ) : (
          <Badge tone="neutral">Atendente</Badge>
        ),
    },
    {
      key: 'acoes',
      header: <span className="sr-only">Ações</span>,
      className: 'w-32',
      cell: (u) => {
        const isSelf = u.id === me?.id
        return (
          <div className="flex items-center justify-end gap-1">
            <IconButton
              aria-label={`Editar ${u.nome}`}
              icon="edit"
              size="sm"
              onClick={() => navigate(`/usuarios/${u.id}`)}
            />
            <IconButton
              aria-label={`Excluir ${u.nome}`}
              icon="trash"
              size="sm"
              disabled={isSelf}
              title={isSelf ? 'Você não pode excluir o próprio usuário' : `Excluir ${u.nome}`}
              onClick={() => setToDelete(u)}
            />
          </div>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Quem pode entrar no sistema. O perfil de cada pessoa vem da lista de administradores do ambiente."
        actions={
          <LinkButton to="/usuarios/novo" icon="plus">
            Novo usuário
          </LinkButton>
        }
      />

      {isLoading && !data ? (
        <Card>
          <LoadingState label="Carregando usuários…" />
        </Card>
      ) : error && !data ? (
        <Alert
          tone="danger"
          title="Não foi possível carregar os usuários"
          action={
            <Button size="sm" variant="secondary" onClick={reload}>
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      ) : (
        <div className="flex flex-col gap-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nome ou e-mail…" />
          <DataTable
            caption="Usuários cadastrados"
            columns={columns}
            rows={rows}
            rowKey={(u) => u.id}
            empty={
              data && data.length > 0 ? (
                <EmptyState
                  title="Nenhum usuário encontrado"
                  description="Revise o texto da busca."
                  action={
                    <Button variant="secondary" onClick={() => setQuery('')}>
                      Limpar busca
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon="usuario"
                  title="Nenhum usuário cadastrado"
                  description="Cadastre a primeira pessoa da equipe."
                  action={
                    <LinkButton to="/usuarios/novo" icon="plus">
                      Novo usuário
                    </LinkButton>
                  }
                />
              )
            }
          />
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir usuário"
        message={`Excluir ${toDelete?.nome ?? ''} (${toDelete?.email ?? ''})? Essa pessoa não conseguirá mais entrar no sistema.`}
        confirmLabel="Excluir"
        tone="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
