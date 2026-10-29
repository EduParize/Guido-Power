import { useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../shared/api/http.ts'
import { orcamentosApi } from '../../shared/api/orcamentos.ts'
import { DECISAO_LABEL, DECISOES } from '../../shared/api/types.ts'
import type { DecisaoOrcamento, Orcamento } from '../../shared/api/types.ts'
import { decodeItens, encodeItens } from '../../shared/lib/budget.ts'
import type { BudgetState } from '../../shared/lib/budget.ts'
import { usePrecoHora } from '../../shared/settings/precoHora.ts'
import { Button, Card, ConfirmDialog, Field, Input, RequiredNote, Select, useDirtyGuard, useToast } from '../../shared/ui'
import { BudgetEditor } from '../../features/budget/BudgetEditor'
import { useItemCatalog } from '../../features/budget/useItemCatalog'
import { focusFirstInvalid } from '../../features/budget/focusFirstInvalid.ts'
import { NO_BUDGET_ERRORS, hasBudgetErrors, validateBudget } from '../../features/budget/validation.ts'
import { formatTelefone, onlyDigits, telefoneDigits } from '../clientes/format'
import { formatPlaca, isPlacaValida, normalizePlaca } from '../veiculos/format'

interface FormState {
  nome: string
  telefone: string
  placa: string
  decisao: DecisaoOrcamento
  budget: BudgetState
}
type LeadErrors = Partial<Record<'telefone' | 'placa', string>>

function initialState(orcamento: Orcamento | undefined, precoHora: number): FormState {
  return {
    nome: orcamento?.nome ?? '',
    telefone: orcamento?.telefone ? formatTelefone(telefoneDigits(orcamento.telefone)) : '',
    placa: orcamento?.placa ? formatPlaca(orcamento.placa) : '',
    decisao: orcamento?.decisao ?? 'PENDENTE',
    budget: orcamento ? decodeItens(orcamento.itens, precoHora) : { pecas: [], maoDeObra: [] },
  }
}

function validateLead(s: FormState): LeadErrors {
  const e: LeadErrors = {}
  if (s.telefone.trim() && onlyDigits(s.telefone).length < 10) e.telefone = 'Informe o telefone com DDD, por exemplo (11) 91234-5678.'
  if (s.placa.trim() && !isPlacaValida(s.placa)) e.placa = 'Placa inválida. Use ABC1234 ou ABC1D23.'
  return e
}

/** Payload do contrato: vazio vira null; telefone só com dígitos; placa sem hífen. valor é calculado pelo backend. */
function toCreateInput(s: FormState) {
  return {
    nome: s.nome.trim() || null,
    telefone: onlyDigits(s.telefone) || null,
    placa: normalizePlaca(s.placa) || null,
    itens: encodeItens(s.budget),
  }
}

export interface OrcamentoFormProps {
  /** Ausente = criação. */
  orcamento?: Orcamento
  /** Ordem de serviço vinculada: o orçamento precisa continuar aprovado e não pode ser excluído. */
  vinculado?: boolean
  /** Edição: chamado após salvar (para recarregar). */
  onSaved?: () => void
}

export function OrcamentoForm({ orcamento, vinculado = false, onSaved }: OrcamentoFormProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const catalog = useItemCatalog()
  const precoHora = usePrecoHora()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<FormState>(() => initialState(orcamento, precoHora))
  const [baseline, setBaseline] = useState(() => JSON.stringify(state))
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isDirty = JSON.stringify(state) !== baseline
  const guard = useDirtyGuard(isDirty)
  const leadErrors = useMemo(() => (submitted ? validateLead(state) : {}), [submitted, state])
  const budgetErrors = useMemo(() => (submitted ? validateBudget(state.budget) : NO_BUDGET_ERRORS), [submitted, state.budget])
  const patch = (changes: Partial<FormState>) => setState((s) => ({ ...s, ...changes }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(validateLead(state)).length > 0 || hasBudgetErrors(validateBudget(state.budget))) {
      focusFirstInvalid(formRef.current)
      return
    }
    setSaving(true)
    try {
      if (orcamento) {
        await orcamentosApi.update(orcamento.id, { ...toCreateInput(state), decisao: state.decisao })
        setBaseline(JSON.stringify(state))
        toast.success('Orçamento atualizado')
        onSaved?.()
      } else {
        const created = await orcamentosApi.create(toCreateInput(state))
        guard.allowLeave()
        toast.success('Orçamento criado')
        navigate(`/orcamentos/${created.id}`)
      }
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!orcamento) return
    setSaving(true)
    try {
      await orcamentosApi.remove(orcamento.id)
      guard.allowLeave()
      toast.success('Orçamento excluído')
      navigate('/orcamentos')
    } catch (e) {
      toast.error(getErrorMessage(e))
      setConfirmDelete(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6">
      {guard.dialog}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Dados do orçamento</h2>
          <RequiredNote />
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Nome" hint="Necessário para cadastrar o cliente a partir do orçamento.">
            <Input value={state.nome} onChange={(e) => patch({ nome: e.target.value })} autoComplete="off" />
          </Field>
          <Field label="Telefone" error={leadErrors.telefone} hint="Com DDD. Necessário para cadastrar o cliente.">
            <Input
              type="tel"
              inputMode="tel"
              value={state.telefone}
              onChange={(e) => patch({ telefone: formatTelefone(e.target.value) })}
              placeholder="(11) 91234-5678"
              autoComplete="off"
            />
          </Field>
          <Field label="Placa" error={leadErrors.placa} hint="Necessária para cadastrar o veículo e abrir a OS.">
            <Input
              value={state.placa}
              onChange={(e) => patch({ placa: e.target.value.toUpperCase() })}
              placeholder="ABC1D23"
              maxLength={8}
              autoComplete="off"
              className="font-mono uppercase"
            />
          </Field>
          {orcamento ? (
            <Field
              label="Decisão do cliente"
              required
              hint={vinculado ? 'Vinculado a uma ordem de serviço: deve permanecer aprovado.' : undefined}
            >
              <Select
                value={state.decisao}
                onChange={(e) => patch({ decisao: e.target.value as DecisaoOrcamento })}
                disabled={vinculado}
              >
                {DECISOES.map((d) => (
                  <option key={d} value={d}>{DECISAO_LABEL[d]}</option>
                ))}
              </Select>
            </Field>
          ) : null}
        </div>
      </Card>

      <section aria-labelledby="itens-orcamento">
        <h2 id="itens-orcamento" className="mb-4 text-2xl font-bold">Itens</h2>
        <BudgetEditor
          value={state.budget}
          onChange={(budget) => patch({ budget })}
          catalog={catalog.parts}
          errors={budgetErrors}
          summaryFooter={
            <>
              <Button type="submit" isLoading={saving} disabled={!!orcamento && !isDirty} icon="check">
                {orcamento ? 'Salvar alterações' : 'Criar orçamento'}
              </Button>
              <Button variant="secondary" disabled={saving} onClick={() => guard.confirmLeave(() => navigate('/orcamentos'))}>
                {orcamento ? 'Voltar à lista' : 'Cancelar'}
              </Button>
              {orcamento ? (
                <Button variant="danger" icon="trash" disabled={saving || vinculado} onClick={() => setConfirmDelete(true)}>
                  Excluir orçamento
                </Button>
              ) : null}
            </>
          }
        />
      </section>
      <ConfirmDialog
        open={confirmDelete}
        tone="danger"
        title="Excluir orçamento"
        message="Excluir este orçamento? Esta ação não pode ser desfeita."
        confirmLabel="Excluir orçamento"
        isLoading={saving}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
    </form>
  )
}
