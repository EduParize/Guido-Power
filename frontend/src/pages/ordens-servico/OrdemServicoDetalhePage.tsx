import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '../../shared/api/http.ts'
import { ordensServicoApi } from '../../shared/api/ordensServico.ts'
import { formatBRL } from '../../shared/lib/money.ts'
import { useResource } from '../../shared/lib/useResource.ts'
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  DecisaoBadge,
  LinkButton,
  LoadingState,
  PageHeader,
  StatusBadge,
  useToast,
} from '../../shared/ui'
import { EventosPanel } from './EventosPanel'
import { OrdemServicoForm } from './OrdemServicoForm'
import { shortId, veiculoLabel } from './osUtils'
import { useCadastros } from './useCadastros'

export function OrdemServicoDetalhePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const os = useResource((signal) => ordensServicoApi.get(id, signal), [id])
  const cadastros = useCadastros()
  const allowLeaveRef = useRef<(() => void) | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function remove() {
    setDeleting(true)
    try {
      await ordensServicoApi.remove(id)
      allowLeaveRef.current?.()
      toast.success('Ordem de serviço excluída')
      navigate('/ordens-servico')
    } catch (e) {
      toast.error(getErrorMessage(e))
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  const ordem = os.data
  if (!ordem) {
    return (
      <>
        <PageHeader title="Ordem de serviço" />
        {os.error ? (
          <Alert
            tone="danger"
            title="Não foi possível abrir a ordem de serviço"
            action={<LinkButton to="/ordens-servico" size="sm" variant="secondary">Voltar à lista</LinkButton>}
          >
            {os.error}
          </Alert>
        ) : (
          <Card><LoadingState label="Carregando ordem de serviço…" /></Card>
        )}
      </>
    )
  }

  const cliente = cadastros.clienteById.get(ordem.clienteId)
  const veiculo = cadastros.veiculoById.get(ordem.veiculoId)
  const orcamento = cadastros.orcamentoById.get(ordem.orcamentoId)

  return (
    <>
      <PageHeader
        title={`Ordem de serviço ${shortId(ordem.id)}`}
        description={`${cliente?.nome ?? 'Cliente não encontrado'} · ${veiculoLabel(veiculo)}`}
        actions={
          <>
            <LinkButton to="/ordens-servico" variant="secondary">Voltar à lista</LinkButton>
            <Button variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>Excluir OS</Button>
          </>
        }
      />
      <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-3">
        <StatusBadge status={ordem.status} className="text-base" />
        {orcamento ? (
          <>
            <DecisaoBadge decisao={orcamento.decisao} className="text-base" />
            <p className="text-base text-text-muted">
              Orçamento <span className="ml-1 font-display text-3xl font-bold text-text tabular-nums">{formatBRL(orcamento.valor)}</span>
            </p>
          </>
        ) : null}
        {cliente ? (
          <Link to={`/clientes/${cliente.id}`} className="text-[15px] font-semibold text-primary underline underline-offset-2">
            Ver cliente
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-10">
        <section aria-labelledby="historico">
          <h2 id="historico" className="mb-4 text-2xl font-bold">Histórico</h2>
          <EventosPanel os={ordem} onChanged={os.reload} />
        </section>

        <section aria-labelledby="dados">
          <h2 id="dados" className="sr-only">Dados da ordem e orçamento</h2>
          {cadastros.clientes && cadastros.veiculos && cadastros.orcamentos && cadastros.ordens ? (
            <OrdemServicoForm
              key={ordem.id}
              os={ordem}
              clientes={cadastros.clientes}
              veiculos={cadastros.veiculos}
              orcamentos={cadastros.orcamentos}
              ordens={cadastros.ordens}
              onSaved={() => { os.reload(); cadastros.reload() }}
              allowLeaveRef={allowLeaveRef}
            />
          ) : cadastros.error ? (
            <Alert tone="danger" title="Não foi possível carregar os cadastros" action={<Button size="sm" variant="secondary" onClick={cadastros.reload}>Tentar novamente</Button>}>
              {cadastros.error}
            </Alert>
          ) : (
            <Card><LoadingState label="Carregando dados…" /></Card>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        tone="danger"
        title="Excluir ordem de serviço"
        message={`Excluir a OS ${shortId(ordem.id)} e todo o seu histórico? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir OS"
        isLoading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
    </>
  )
}
