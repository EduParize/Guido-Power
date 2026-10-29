import { useState } from 'react'
import type { Cliente, Orcamento, OrdemServico, Veiculo } from '../../shared/api/types.ts'
import { Badge, Button, Card, LinkButton } from '../../shared/ui'
import { telefoneDigits } from '../clientes/format'
import { shortId as osShortId } from '../ordens-servico/osUtils'
import { normalizePlaca } from '../veiculos/format'
import { ClienteDoOrcamentoModal, VeiculoDoOrcamentoModal } from './CadastroModais'
import { placaLabel } from './orcamentoUtils'

export interface ProximosPassosProps {
  orcamento: Orcamento
  clientes: Cliente[]
  veiculos: Veiculo[]
  /** OS que já usa este orçamento, se houver. */
  ordem: OrdemServico | undefined
  /** Recarrega clientes e veículos após um cadastro. */
  onCadastrado: () => void
}

/** Orçamento aprovado: cadastrar cliente e veículo a partir dele e abrir a ordem de serviço. */
export function ProximosPassos({ orcamento, clientes, veiculos, ordem, onCadastrado }: ProximosPassosProps) {
  const [modal, setModal] = useState<'cliente' | 'veiculo' | null>(null)
  const telefone = orcamento.telefone ? telefoneDigits(orcamento.telefone) : ''
  const placa = orcamento.placa ? normalizePlaca(orcamento.placa) : ''
  const cliente = telefone ? clientes.find((c) => telefoneDigits(c.telefone) === telefone) : undefined
  const veiculo = placa ? veiculos.find((v) => normalizePlaca(v.placa) === placa) : undefined
  const podeCliente = !!orcamento.nome && !!orcamento.telefone
  const done = () => {
    setModal(null)
    onCadastrado()
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold">Próximos passos</h2>
      <ul className="mt-2 divide-y divide-border">
        <li className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-base font-semibold">Cliente</p>
            <p className="text-[15px] text-text-muted">
              {cliente
                ? `Cadastrado: ${cliente.nome}`
                : podeCliente
                  ? 'Ainda não cadastrado. Já é cliente? Escolha-o ao abrir a ordem de serviço.'
                  : 'Informe nome e telefone no orçamento para cadastrar o cliente.'}
            </p>
          </div>
          {cliente ? <Badge tone="success">Cadastrado</Badge> : (
            <Button variant="secondary" icon="cliente" disabled={!podeCliente} onClick={() => setModal('cliente')}>
              Cadastrar cliente a partir do orçamento
            </Button>
          )}
        </li>
        <li className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-base font-semibold">Veículo</p>
            <p className="text-[15px] text-text-muted">
              {veiculo
                ? `Cadastrado: ${placaLabel(orcamento)}`
                : placa
                  ? 'Ainda não cadastrado.'
                  : 'Informe a placa no orçamento para cadastrar o veículo.'}
            </p>
          </div>
          {veiculo ? <Badge tone="success">Cadastrado</Badge> : (
            <Button variant="secondary" icon="veiculo" disabled={!placa} onClick={() => setModal('veiculo')}>
              Cadastrar veículo a partir do orçamento
            </Button>
          )}
        </li>
        <li className="py-3">
          <p className="text-base font-semibold">Ordem de serviço</p>
          <p className="text-[15px] text-text-muted">
            {ordem ? `Vinculada à OS ${osShortId(ordem.id)}.` : 'Abra a OS com este orçamento aprovado.'}
          </p>
        </li>
      </ul>
      <div className="mt-2">
        {ordem ? (
          <LinkButton to={`/ordens-servico/${ordem.id}`} icon="ordem">Ver ordem de serviço</LinkButton>
        ) : (
          <LinkButton to={`/ordens-servico/nova?orcamentoId=${orcamento.id}`} icon="ordem">Abrir ordem de serviço</LinkButton>
        )}
      </div>
      {modal === 'cliente' ? <ClienteDoOrcamentoModal orcamento={orcamento} onClose={() => setModal(null)} onCreated={done} /> : null}
      {modal === 'veiculo' ? (
        <VeiculoDoOrcamentoModal
          orcamento={orcamento}
          clientes={clientes}
          veiculos={veiculos}
          donoInicial={cliente?.id ?? ''}
          onClose={() => setModal(null)}
          onCreated={done}
        />
      ) : null}
    </Card>
  )
}
