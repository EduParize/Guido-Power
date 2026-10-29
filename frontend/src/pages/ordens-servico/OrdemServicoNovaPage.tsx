import { useSearchParams } from 'react-router-dom'
import { Alert, Button, Card, LoadingState, PageHeader } from '../../shared/ui'
import { OrdemServicoForm } from './OrdemServicoForm'
import { useCadastros } from './useCadastros'

export function OrdemServicoNovaPage() {
  const [params] = useSearchParams()
  const { clientes, veiculos, orcamentos, ordens, error, isLoading, reload } = useCadastros()

  return (
    <>
      <PageHeader title="Nova ordem de serviço" description="Vincule um orçamento aprovado ao veículo e descreva o serviço. O status inicial entra no histórico." />
      {!clientes || !veiculos || !orcamentos || !ordens ? (
        error ? (
          <Alert tone="danger" title="Não foi possível carregar os cadastros" action={<Button size="sm" variant="secondary" onClick={reload}>Tentar novamente</Button>}>
            {error}
          </Alert>
        ) : (
          <Card>{isLoading ? <LoadingState label="Carregando cadastros…" /> : null}</Card>
        )
      ) : (
        <OrdemServicoForm
          clientes={clientes}
          veiculos={veiculos}
          orcamentos={orcamentos}
          ordens={ordens}
          initialClienteId={params.get('clienteId') ?? undefined}
          initialOrcamentoId={params.get('orcamentoId') ?? undefined}
        />
      )}
    </>
  )
}
