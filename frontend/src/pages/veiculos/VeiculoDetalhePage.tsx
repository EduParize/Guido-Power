import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '../../shared/api/http.ts'
import { veiculosApi } from '../../shared/api/veiculos.ts'
import { useResource } from '../../shared/lib/useResource.ts'
import { Alert, Button, Card, ConfirmDialog, LinkButton, LoadingState, PageHeader, useToast } from '../../shared/ui'
import { formatPlaca } from './format'
import { VeiculoForm } from './VeiculoForm'

export function VeiculoDetalhePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data: veiculo, error, isLoading, reload } = useResource((signal) => veiculosApi.get(id, signal), [id])
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function remove() {
    setDeleting(true)
    try {
      await veiculosApi.remove(id)
      toast.success('Veículo excluído.')
      navigate('/veiculos')
    } catch (e) {
      toast.error(getErrorMessage(e))
      setConfirmingDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading && !veiculo) return <Card><LoadingState label="Carregando veículo…" /></Card>
  if (!veiculo) {
    return (
      <Alert
        tone="danger"
        title="Não foi possível carregar o veículo"
        action={<LinkButton to="/veiculos" size="sm" variant="secondary">Voltar para veículos</LinkButton>}
      >
        {error}
      </Alert>
    )
  }

  return (
    <>
      <PageHeader
        title={formatPlaca(veiculo.placa)}
        description={`${veiculo.marca} ${veiculo.modelo}, ${veiculo.ano}`}
        actions={
          <>
            <LinkButton to="/veiculos" variant="secondary">Voltar</LinkButton>
            <Button variant="secondary" icon="trash" className="text-danger" onClick={() => setConfirmingDelete(true)}>
              Excluir veículo
            </Button>
          </>
        }
      />
      <VeiculoForm key={veiculo.id} initial={veiculo} cancelTo="/veiculos" onSaved={reload} />
      <ConfirmDialog
        open={confirmingDelete}
        tone="danger"
        title="Excluir veículo"
        message={
          <>
            Excluir o veículo <strong>{formatPlaca(veiculo.placa)}</strong>? Esta ação não pode ser desfeita. O sistema não permite
            excluir veículos que já têm ordens de serviço.
          </>
        }
        confirmLabel="Excluir"
        isLoading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  )
}
