import { useParams } from 'react-router-dom'
import { orcamentosApi } from '../../shared/api/orcamentos.ts'
import { formatBRL } from '../../shared/lib/money.ts'
import { useResource } from '../../shared/lib/useResource.ts'
import { Alert, Button, Card, DecisaoBadge, LinkButton, LoadingState, PageHeader } from '../../shared/ui'
import { useCadastros } from '../ordens-servico/useCadastros'
import { OrcamentoForm } from './OrcamentoForm'
import { ProximosPassos } from './ProximosPassos'
import { shortId } from './orcamentoUtils'

export function OrcamentoDetalhePage() {
  const { id = '' } = useParams()
  const orcamento = useResource((signal) => orcamentosApi.get(id, signal), [id])
  const cadastros = useCadastros()
  const data = orcamento.data
  const ordem = cadastros.ordens?.find((o) => o.orcamentoId === id)

  if (!data) {
    return (
      <>
        <PageHeader title="Orçamento" description={`Orçamento ${shortId(id)}`} />
        {orcamento.error ? (
          <Alert tone="danger" title="Não foi possível abrir o orçamento" action={<LinkButton to="/orcamentos" size="sm" variant="secondary">Voltar à lista</LinkButton>}>
            {orcamento.error}
          </Alert>
        ) : (
          <Card><LoadingState label="Carregando orçamento…" /></Card>
        )}
      </>
    )
  }

  return (
    <>
      <PageHeader title={data.nome || `Orçamento ${shortId(data.id)}`} description={`Orçamento ${shortId(data.id)}`} />
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <DecisaoBadge decisao={data.decisao} className="text-base" />
        <p className="text-base text-text-muted">
          Total <span className="ml-1 font-display text-3xl font-bold text-text tabular-nums">{formatBRL(data.valor)}</span>
        </p>
      </div>
      <div className="flex flex-col gap-8">
        {data.decisao === 'APROVADO' ? (
          cadastros.clientes && cadastros.veiculos ? (
            <ProximosPassos
              orcamento={data}
              clientes={cadastros.clientes}
              veiculos={cadastros.veiculos}
              ordem={ordem}
              onCadastrado={cadastros.reload}
            />
          ) : cadastros.error ? (
            <Alert tone="danger" title="Não foi possível carregar clientes e veículos" action={<Button size="sm" variant="secondary" onClick={cadastros.reload}>Tentar novamente</Button>}>
              {cadastros.error}
            </Alert>
          ) : (
            <Card><LoadingState label="Carregando cadastros…" /></Card>
          )
        ) : null}
        <OrcamentoForm key={data.id} orcamento={data} vinculado={!!ordem} onSaved={() => { orcamento.reload(); cadastros.reload() }} />
      </div>
    </>
  )
}
