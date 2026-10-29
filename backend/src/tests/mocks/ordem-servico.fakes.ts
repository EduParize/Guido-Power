import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import {
  EResultadoEnvio,
  EStatusNotificacao,
  Evento,
  EventoAtualizacao,
  EventoInput,
  NotificacaoEvento,
} from "../../domain/ordem-servico/entity/evento.entity";
import {
  OrdemServico,
  OrdemServicoAtualizacao,
  OrdemServicoCriacao,
  OrdemServicoInput,
} from "../../domain/ordem-servico/entity/ordem-servico.entity";
import { OrdemServicoRepositoryRead } from "../../domain/ordem-servico/repository/ordem-servico.repository.read";
import {
  EventoMutado,
  OrdemServicoRepositoryWrite,
  ResultadoMutacao,
} from "../../domain/ordem-servico/repository/ordem-servico.repository.write";
import { EDecisao } from "../../domain/orcamento/entity/e-decisao";
import { ETipo } from "../../domain/orcamento/entity/e-tipo";
import {
  Orcamento,
  OrcamentoGravacao,
  OrcamentoInput,
} from "../../domain/orcamento/entity/orcamento.entity";
import { OrcamentoRepositoryRead } from "../../domain/orcamento/repository/orcamento.repository.read";
import { OrcamentoRepositoryWrite } from "../../domain/orcamento/repository/orcamento.repository.write";

export class FakeOrdemServicoRepository
  implements OrdemServicoRepositoryRead, OrdemServicoRepositoryWrite
{
  items: OrdemServico[] = [];
  private seq = 0;
  private seqEvento = 0;

  novoEventoId() {
    return `64e0000000000000000000${String(++this.seqEvento).padStart(2, "0")}`;
  }

  async findById(id: string) { return this.items.find((o) => o.id === id) ?? null; }
  async list() { return [...this.items]; }
  async existsByVeiculoId(veiculoId: string) {
    return this.items.some((o) => o.veiculoId === veiculoId);
  }

  async existsByOrcamentoId(orcamentoId: string, excluirOrdemId?: string) {
    return this.items.some(
      (o) => o.orcamentoId === orcamentoId && o.id !== excluirOrdemId,
    );
  }

  async create(data: OrdemServicoCriacao) {
    const ordem: OrdemServico = {
      id: `64d0000000000000000000${String(++this.seq).padStart(2, "0")}`,
      ...data,
      historico: data.historico.map((e) => ({ id: this.novoEventoId(), ...e })),
    };
    this.items.push(ordem);
    return ordem;
  }

  async update(id: string, data: OrdemServicoAtualizacao) {
    const i = this.items.findIndex((o) => o.id === id);
    if (i < 0) return null;
    this.items[i] = { ...this.items[i], ...data };
    return this.items[i];
  }

  async delete(id: string) {
    const antes = this.items.length;
    this.items = this.items.filter((o) => o.id !== id);
    return this.items.length < antes;
  }

  async listEventos(ordemId: string) {
    const ordem = this.items.find((o) => o.id === ordemId);
    return ordem ? [...ordem.historico] : null;
  }

  async findEventoById(ordemId: string, eventoId: string) {
    const ordem = this.items.find((o) => o.id === ordemId);
    return ordem?.historico.find((e) => e.id === eventoId) ?? null;
  }

  async addEvento(
    ordemId: string,
    evento: EventoInput,
    historicoVersao: number,
  ): Promise<ResultadoMutacao<EventoMutado>> {
    const ordem = this.items.find((o) => o.id === ordemId);
    if (!ordem) return { tipo: "nao_encontrado" };
    const ultimo = ordem.historico[ordem.historico.length - 1];
    if (
      ordem.historicoVersao !== historicoVersao
      || ordem.status === evento.status
      || ultimo?.notificacao.status === EStatusNotificacao.PENDENTE
    ) {
      return { tipo: "conflito" };
    }
    const novo: Evento = { id: this.novoEventoId(), ...evento };
    ordem.historico = [...ordem.historico, novo];
    ordem.status = evento.status;
    ordem.historicoVersao += 1;
    return { tipo: "sucesso", valor: { ordem, evento: novo } };
  }

  async updateEvento(
    ordemId: string,
    eventoId: string,
    dados: EventoAtualizacao,
    historicoVersao: number,
    statusOrdem?: EStatus,
  ): Promise<ResultadoMutacao<EventoMutado>> {
    const ordem = this.items.find((o) => o.id === ordemId);
    const indice = ordem ? ordem.historico.findIndex((e) => e.id === eventoId) : -1;
    if (!ordem || indice < 0) return { tipo: "nao_encontrado" };
    if (
      ordem.historicoVersao !== historicoVersao
      || ordem.historico[indice].notificacao.status === EStatusNotificacao.PENDENTE
    ) {
      return { tipo: "conflito" };
    }
    const atualizado = { ...ordem.historico[indice], ...dados };
    ordem.historico = ordem.historico.map((e, i) => (i === indice ? atualizado : e));
    if (statusOrdem !== undefined) ordem.status = statusOrdem;
    ordem.historicoVersao += 1;
    return { tipo: "sucesso", valor: { ordem, evento: atualizado } };
  }

  async removeEvento(
    ordemId: string,
    eventoId: string,
    historicoVersao: number,
    statusOrdem?: EStatus,
  ): Promise<ResultadoMutacao<OrdemServico>> {
    const ordem = this.items.find((o) => o.id === ordemId);
    const evento = ordem?.historico.find((item) => item.id === eventoId);
    if (!ordem || !evento) return { tipo: "nao_encontrado" };
    if (
      ordem.historicoVersao !== historicoVersao
      || ordem.historico.length === 1
      || evento.notificacao.status === EStatusNotificacao.PENDENTE
    ) {
      return { tipo: "conflito" };
    }
    ordem.historico = ordem.historico.filter((e) => e.id !== eventoId);
    if (statusOrdem !== undefined) ordem.status = statusOrdem;
    ordem.historicoVersao += 1;
    return { tipo: "sucesso", valor: ordem };
  }

  async claimNotificacao(
    ordemId: string,
    eventoId: string,
    historicoVersao: number,
    notificacao: NotificacaoEvento,
    pendenteAntesDe: Date,
  ): Promise<ResultadoMutacao<EventoMutado>> {
    const ordem = this.items.find((item) => item.id === ordemId);
    const evento = ordem?.historico.find((item) => item.id === eventoId);
    if (!ordem || !evento) return { tipo: "nao_encontrado" };
    const ultimo = ordem.historico[ordem.historico.length - 1];
    const pendenteExpirou = evento.notificacao.status === EStatusNotificacao.PENDENTE
      && evento.notificacao.ultimaTentativaEm !== null
      && evento.notificacao.ultimaTentativaEm <= pendenteAntesDe;
    const podeReenviar = evento.notificacao.status === EStatusNotificacao.FALHA || pendenteExpirou;
    if (
      ordem.historicoVersao !== historicoVersao
      || ultimo.id !== eventoId
      || !podeReenviar
    ) {
      return { tipo: "conflito" };
    }
    evento.notificacao = notificacao;
    ordem.historicoVersao += 1;
    return { tipo: "sucesso", valor: { ordem, evento } };
  }

  async finalizarNotificacao(
    ordemId: string,
    eventoId: string,
    tentativaId: string,
    status: EStatusNotificacao.ENVIADA | EStatusNotificacao.FALHA,
    resultadoEnvio: EResultadoEnvio | null,
  ): Promise<ResultadoMutacao<EventoMutado>> {
    const ordem = this.items.find((item) => item.id === ordemId);
    const evento = ordem?.historico.find((item) => item.id === eventoId);
    if (!ordem || !evento) return { tipo: "nao_encontrado" };
    if (
      evento.notificacao.status !== EStatusNotificacao.PENDENTE
      || evento.notificacao.tentativaId !== tentativaId
    ) {
      return { tipo: "conflito" };
    }
    evento.notificacao = {
      ...evento.notificacao,
      status,
      resultadoEnvio,
    };
    ordem.historicoVersao += 1;
    return { tipo: "sucesso", valor: { ordem, evento } };
  }
}

export class FakeOrcamentoRepository
  implements OrcamentoRepositoryRead, OrcamentoRepositoryWrite
{
  items: Orcamento[] = [];
  private seq = 0;

  async findById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async list() {
    return [...this.items];
  }

  async create(data: OrcamentoGravacao) {
    this.seq = Math.max(this.seq, this.items.length);
    const criado: Orcamento = {
      id: `64f0000000000000000000${String(++this.seq).padStart(2, "0")}`,
      nome: data.nome,
      telefone: data.telefone,
      placa: data.placa,
      valorCentavos: data.valorCentavos,
      itens: data.itens,
      decisao: data.decisao,
      decisaoData: data.decisaoData,
    };
    this.items.push(criado);
    return criado;
  }

  async update(id: string, data: OrcamentoGravacao) {
    const item = this.items.find((orcamento) => orcamento.id === id);
    if (!item) return null;
    item.nome = data.nome;
    item.telefone = data.telefone;
    item.placa = data.placa;
    item.valorCentavos = data.valorCentavos;
    item.itens = data.itens;
    item.decisao = data.decisao;
    item.decisaoData = data.decisaoData;
    return item;
  }

  async delete(id: string) {
    const antes = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    return this.items.length < antes;
  }
}

export const ORCAMENTO_ID = "64f000000000000000000001";

const ITENS_PADRAO = [{
  descricao: "Pastilha",
  tipo: ETipo.PECA,
  quantidade: 2,
  valorUnitarioCentavos: 8025,
}];

export const orcamentoDominioInput: OrcamentoInput = {
  nome: null,
  telefone: null,
  placa: null,
  decisao: EDecisao.PENDENTE,
  valorCentavos: 16050,
  itens: ITENS_PADRAO,
};

export function orcamentoGravacao(overrides: Partial<OrcamentoGravacao> = {}): OrcamentoGravacao {
  return {
    ...orcamentoDominioInput,
    decisaoData: new Date("2024-01-01T12:00:00.000Z"),
    ...overrides,
  };
}

export function orcamentoAprovadoSeed(
  id = ORCAMENTO_ID,
  overrides: Partial<Orcamento> = {},
): Orcamento {
  return {
    id,
    ...orcamentoGravacao({ decisao: EDecisao.APROVADO }),
    ...overrides,
  };
}

export function orcamentoHttpBody(overrides: Record<string, unknown> = {}) {
  return {
    itens: [{
      descricao: "Pastilha",
      tipo: ETipo.PECA,
      quantidade: 2,
      valorUnitario: 80.25,
    }],
    ...overrides,
  };
}

export function ordemInput(status: EStatus = EStatus.EM_ESPERA, orcamentoId = ORCAMENTO_ID) {
  const input = {
    veiculoId: "64a000000000000000000010",
    clienteId: "64a000000000000000000020",
    orcamentoId,
    descricao: "Revisão",
    status,
  };
  if (status === EStatus.PAUSADO || status === EStatus.CANCELADO) {
    return { ...input, motivo: "Motivo informado" };
  }
  return input;
}

export function ordemUpdateInput(orcamentoId = ORCAMENTO_ID) {
  const { status: _status, ...resto } = ordemInput(EStatus.EM_ESPERA, orcamentoId);
  return resto;
}

export function ordemDominioInput(
  status: EStatus = EStatus.EM_ESPERA,
  orcamentoId = ORCAMENTO_ID,
): OrdemServicoInput {
  const input: OrdemServicoInput = {
    veiculoId: "64a000000000000000000010",
    clienteId: "64a000000000000000000020",
    orcamentoId,
    descricao: "Revisão",
    status,
  };
  if (status === EStatus.PAUSADO || status === EStatus.CANCELADO) {
    input.motivo = "Motivo informado";
  }
  return input;
}

export function ordemDominioUpdateInput(orcamentoId = ORCAMENTO_ID) {
  const { status: _status, motivo: _motivo, ...resto } = ordemDominioInput(
    EStatus.EM_ESPERA,
    orcamentoId,
  );
  return resto;
}
