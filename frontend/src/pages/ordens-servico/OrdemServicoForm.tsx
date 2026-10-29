import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, RefObject } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ordensServicoApi } from '../../shared/api/ordensServico.ts'
import { getErrorMessage } from '../../shared/api/http.ts'
import { STATUS_ORDEM } from '../../shared/api/types.ts'
import type { Cliente, Id, Orcamento, OrdemServico, Veiculo } from '../../shared/api/types.ts'
import { matchesQuery } from '../../shared/lib/search.ts'
import {
  Alert,
  Button,
  Card,
  Combobox,
  Field,
  Input,
  RequiredNote,
  Select,
  Textarea,
  useDirtyGuard,
  useToast,
} from '../../shared/ui'
import { ClienteCombobox } from '../../shared/ui/ClienteCombobox'
import { focusFirstInvalid } from '../../features/budget/focusFirstInvalid.ts'
import { formatTelefone, telefoneDigits } from '../clientes/format'
import { OrcamentoResumo } from './OrcamentoResumo'
import { initialOsState, needsMotivo, orcamentosDisponiveis, placaDivergente, sugerirCadastros, toCreateInput, toUpdateInput, validateOs } from './osFormState'
import type { OsFormErrors, OsFormState } from './osFormState'
import { orcamentoLabel, veiculoLabel } from './osUtils'

export interface OrdemServicoFormProps {
  /** Ausente = criação. */
  os?: OrdemServico
  clientes: Cliente[]
  veiculos: Veiculo[]
  orcamentos: Orcamento[]
  /** Todas as OS: um orçamento só pode ser usado por uma. */
  ordens: OrdemServico[]
  initialClienteId?: Id
  initialOrcamentoId?: Id
  /** Edição: chamado após salvar (para recarregar a OS). */
  onSaved?: (os: OrdemServico) => void
  /** Recebe a função que libera o bloqueio de saída (ex.: antes de navegar após excluir a OS). */
  allowLeaveRef?: RefObject<(() => void) | null>
}

export function OrdemServicoForm({
  os,
  clientes,
  veiculos,
  orcamentos,
  ordens,
  initialClienteId,
  initialOrcamentoId,
  onSaved,
  allowLeaveRef,
}: OrdemServicoFormProps) {
  const mode = os ? 'edit' : 'create'
  const navigate = useNavigate()
  const toast = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<OsFormState>(() => {
    const disponivel = orcamentosDisponiveis(orcamentos, ordens, undefined).some((o) => o.id === initialOrcamentoId)
    const initial = initialOsState(os, { orcamentoId: disponivel ? initialOrcamentoId : undefined, clienteId: initialClienteId })
    if (os) return initial
    const sugestao = sugerirCadastros(orcamentos.find((o) => o.id === initial.orcamentoId), clientes, veiculos)
    const clienteId = initial.clienteId || sugestao.clienteId
    const doCliente = veiculos.filter((v) => v.dono === clienteId)
    const veiculoId = sugestao.veiculoId || (doCliente.length === 1 ? doCliente[0].id : '')
    return { ...initial, clienteId, veiculoId }
  })
  const [baseline, setBaseline] = useState(() => JSON.stringify(state))
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const isDirty = JSON.stringify(state) !== baseline
  const guard = useDirtyGuard(isDirty)

  useEffect(() => {
    if (allowLeaveRef) allowLeaveRef.current = guard.allowLeave
  }, [allowLeaveRef, guard.allowLeave])

  // Aprovados e ainda sem OS (a OS em edição mantém o seu).
  const disponiveis = useMemo(() => orcamentosDisponiveis(orcamentos, ordens, os?.id), [orcamentos, ordens, os?.id])
  const orcamento = orcamentos.find((o) => o.id === state.orcamentoId)
  const veiculosDoCliente = useMemo(
    () => veiculos.filter((v) => v.dono === state.clienteId).sort((a, b) => a.placa.localeCompare(b.placa, 'pt-BR')),
    [veiculos, state.clienteId],
  )
  const placaErro = placaDivergente(orcamento, veiculos.find((v) => v.id === state.veiculoId))
  const errors = useMemo<OsFormErrors>(() => {
    if (!submitted) return placaErro ? { veiculo: placaErro } : {}
    const found = validateOs(state, mode)
    return { ...found, veiculo: found.veiculo ?? placaErro }
  }, [submitted, state, mode, placaErro])

  const patch = (changes: Partial<OsFormState>) => setState((s) => ({ ...s, ...changes }))

  function pickOrcamento(item: Orcamento | null) {
    const sugestao = sugerirCadastros(item ?? undefined, clientes, veiculos)
    setState((s) => {
      // Só preenche o que ainda está vazio.
      const clienteId = s.clienteId || sugestao.clienteId
      const veiculoId = s.veiculoId || (clienteId === sugestao.clienteId ? sugestao.veiculoId : '')
      return { ...s, orcamentoId: item?.id ?? '', clienteId, veiculoId }
    })
  }

  function pickCliente(id: Id | '') {
    const lista = veiculos.filter((v) => v.dono === id)
    setState((s) => ({
      ...s,
      clienteId: id,
      // Cliente com um único veículo (ex.: achado pela placa): já deixa selecionado.
      veiculoId: lista.length === 1 ? lista[0].id : lista.some((v) => v.id === s.veiculoId) ? s.veiculoId : '',
    }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(validateOs(state, mode)).length > 0 || placaErro) {
      focusFirstInvalid(formRef.current)
      return
    }
    setSaving(true)
    try {
      if (os) {
        const saved = await ordensServicoApi.update(os.id, toUpdateInput(state))
        setBaseline(JSON.stringify(state))
        toast.success('Ordem de serviço atualizada')
        onSaved?.(saved)
      } else {
        const created = await ordensServicoApi.create(toCreateInput(state))
        guard.allowLeave()
        toast.success('Ordem de serviço criada')
        navigate(`/ordens-servico/${created.id}`)
      }
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => guard.confirmLeave(() => navigate('/ordens-servico'))

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6">
      {guard.dialog}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Dados da ordem</h2>
          <RequiredNote />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Combobox<Orcamento>
              items={disponiveis}
              getKey={(o) => o.id}
              getLabel={orcamentoLabel}
              filter={(o, q) => matchesQuery(q, o.nome, o.placa, o.telefone, o.telefone ? formatTelefone(telefoneDigits(o.telefone)) : '', o.id.slice(-6))}
              value={orcamento && disponiveis.some((o) => o.id === orcamento.id) ? orcamento : null}
              onChange={pickOrcamento}
              label="Orçamento aprovado"
              placeholder="Digite nome, placa ou telefone"
              required
              error={errors.orcamento}
              emptyText="Nenhum orçamento aprovado disponível"
            />
            <p className="text-sm text-text-muted">
              Só aparecem orçamentos aprovados que ainda não têm ordem de serviço.{' '}
              <Link className="font-semibold text-primary underline underline-offset-2" to="/orcamentos/novo">
                Novo orçamento
              </Link>
            </p>
          </div>
          <ClienteCombobox
            value={state.clienteId}
            onChange={(id) => pickCliente(id)}
            clientes={clientes}
            veiculos={veiculos}
            required
            error={errors.cliente}
          />
          <div className="flex flex-col gap-1.5">
            <Field label="Veículo" required error={errors.veiculo}>
              <Select
                value={state.veiculoId}
                onChange={(e) => patch({ veiculoId: e.target.value })}
                disabled={!state.clienteId}
                placeholder={state.clienteId ? 'Selecione o veículo' : 'Escolha o cliente primeiro'}
              >
                {veiculosDoCliente.map((v) => (
                  <option key={v.id} value={v.id}>
                    {veiculoLabel(v)}
                    {v.ano ? ` (${v.ano})` : ''}
                  </option>
                ))}
              </Select>
            </Field>
            {state.clienteId ? (
              <p className="text-sm text-text-muted">
                {veiculosDoCliente.length === 0 ? 'Este cliente ainda não tem veículos. ' : 'Não está na lista? '}
                {orcamento?.placa ? 'Cadastre o veículo pelo orçamento.' : (
                  <Link className="font-semibold text-primary underline underline-offset-2" to={`/veiculos/novo?clienteId=${state.clienteId}`}>
                    Cadastrar veículo
                  </Link>
                )}
              </p>
            ) : null}
          </div>
          <Field label="Descrição do serviço" required error={errors.descricao} className="md:col-span-2">
            <Textarea
              value={state.descricao}
              onChange={(e) => patch({ descricao: e.target.value })}
              placeholder="Ex.: Barulho na suspensão dianteira, revisão dos 40 mil km"
            />
          </Field>
          {mode === 'create' ? (
            <Field label="Status inicial" required error={errors.status}>
              <Select
                value={state.status}
                onChange={(e) => patch({ status: e.target.value as OsFormState['status'], motivo: '' })}
                placeholder="Selecione o status"
              >
                {STATUS_ORDEM.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
          ) : null}
          {mode === 'create' && needsMotivo(state.status) ? (
            <Field label="Motivo" required error={errors.motivo} className="md:col-span-2">
              <Input
                value={state.motivo}
                onChange={(e) => patch({ motivo: e.target.value })}
                placeholder={`Por que a OS está ${state.status === 'Pausado' ? 'pausada' : 'cancelada'}?`}
                autoComplete="off"
              />
            </Field>
          ) : null}
        </div>
      </Card>

      {orcamento ? (
        <section aria-labelledby="orcamento-os">
          <h2 id="orcamento-os" className="sr-only">Orçamento</h2>
          <OrcamentoResumo orcamento={orcamento} />
        </section>
      ) : (
        <Alert tone="info">Escolha o orçamento aprovado para ver os itens e o total.</Alert>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={saving} icon="check">
          {mode === 'create' ? 'Criar ordem de serviço' : 'Salvar alterações'}
        </Button>
        <Button variant="secondary" onClick={cancel} disabled={saving}>
          {mode === 'create' ? 'Cancelar' : 'Voltar à lista'}
        </Button>
      </div>
    </form>
  )
}
