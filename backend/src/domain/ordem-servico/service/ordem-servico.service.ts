import { randomUUID } from "node:crypto";
import {
  AppError,
  ConflictError,
  NotificationError,
  NotFoundError,
  ValidationError,
} from "../../common/errors/app-error";
import { ClienteRepositoryRead } from "../../cliente/repository/cliente.repository.read";
import { VeiculoRepositoryRead } from "../../veiculo/repository/veiculo.repository.read";
import { EStatus } from "../entity/e-status";
import {
  EResultadoEnvio,
  EStatusNotificacao,
  Evento,
  EventoAtualizacao,
  NotificacaoEvento,
} from "../entity/evento.entity";
import {
  OrdemServico,
  OrdemServicoAtualizacao,
  OrdemServicoInput,
  OrdemServicoUpdateInput,
} from "../entity/ordem-servico.entity";
import { TemplateWhatsapp } from "../entity/template-whatsapp";
import {
  WhatsappTemplateError,
  WhatsappTemplateGateway,
} from "../gateway/whatsapp-template.gateway";
import { OrdemServicoRepositoryRead } from "../repository/ordem-servico.repository.read";
import {
  EventoMutado,
  OrdemServicoRepositoryWrite,
  ResultadoMutacao,
} from "../repository/ordem-servico.repository.write";

const TEMPLATE_POR_STATUS: Record<EStatus, TemplateWhatsapp> = {
  [EStatus.EM_ESPERA]: TemplateWhatsapp.EmEspera,
  [EStatus.DIAGNOSTICO]: TemplateWhatsapp.Diagnostico,
  [EStatus.EM_SERVICO]: TemplateWhatsapp.EmServico,
  [EStatus.AGUARDANDO_PECA]: TemplateWhatsapp.AguardandoPeca,
  [EStatus.PAUSADO]: TemplateWhatsapp.ServicoPausado,
  [EStatus.FINALIZADO]: TemplateWhatsapp.Finalizado,
  [EStatus.CANCELADO]: TemplateWhatsapp.ServicoCancelado,
};

const STATUS_COM_MOTIVO = [EStatus.PAUSADO, EStatus.CANCELADO];
const TEMPO_PENDENTE_MS = 30_000;

export type NovoEvento = {
  status: EStatus;
  data?: Date;
  motivo?: string;
};

export class OrdemServicoService {
  constructor(
    private readonly readRepo: OrdemServicoRepositoryRead,
    private readonly writeRepo: OrdemServicoRepositoryWrite,
    private readonly veiculoRepo: VeiculoRepositoryRead,
    private readonly clienteRepo: ClienteRepositoryRead,
    private readonly whatsapp: WhatsappTemplateGateway,
  ) {}

  list(): Promise<OrdemServico[]> {
    return this.readRepo.list();
  }

  async getById(id: string): Promise<OrdemServico> {
    const ordem = await this.readRepo.findById(id);
    if (!ordem) throw new NotFoundError("Ordem de serviço não encontrada");
    return ordem;
  }

  // O status inicial vira o primeiro evento do histórico (sem WhatsApp).
  async create(input: OrdemServicoInput): Promise<OrdemServico> {
    await this.garantirVinculo(input.veiculoId, input.clienteId);
    const agora = new Date();
    const motivo = this.normalizaMotivo(input.status, input.motivo);
    return this.writeRepo.create({
      veiculoId: input.veiculoId,
      clienteId: input.clienteId,
      decisao: input.decisao,
      decisaoData: agora,
      descricao: input.descricao.trim(),
      orcamentoCentavos: input.orcamentoCentavos,
      status: input.status,
      historico: [{
        status: input.status,
        data: agora,
        motivo,
        notificacao: this.notificacaoNaoAplicavel(),
      }],
      historicoVersao: 0,
      itens: input.itens,
    });
  }

  async update(id: string, input: OrdemServicoUpdateInput): Promise<OrdemServico> {
    const atual = await this.getById(id);
    await this.garantirVinculo(input.veiculoId, input.clienteId);

    const gravacao: OrdemServicoAtualizacao = {
      veiculoId: input.veiculoId,
      clienteId: input.clienteId,
      decisao: input.decisao,
      decisaoData: atual.decisao === input.decisao ? atual.decisaoData : new Date(),
      descricao: input.descricao.trim(),
      orcamentoCentavos: input.orcamentoCentavos,
      itens: input.itens,
    };
    const salva = await this.writeRepo.update(id, gravacao);
    if (!salva) throw new NotFoundError("Ordem de serviço não encontrada");
    return salva;
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.writeRepo.delete(id);
  }

  async listEventos(ordemId: string): Promise<Evento[]> {
    const historico = await this.readRepo.listEventos(ordemId);
    if (!historico) throw new NotFoundError("Ordem de serviço não encontrada");
    return historico;
  }

  async getEvento(ordemId: string, eventoId: string): Promise<Evento> {
    await this.getById(ordemId);
    const evento = await this.readRepo.findEventoById(ordemId, eventoId);
    if (!evento) throw new NotFoundError("Evento não encontrado");
    return evento;
  }

  async addEvento(ordemId: string, input: NovoEvento): Promise<Evento> {
    this.garantirStatus(input.status);
    const data = input.data === undefined ? new Date() : this.garantirData(input.data);
    const ordem = await this.getById(ordemId);
    const motivo = this.normalizaMotivo(input.status, input.motivo);

    if (ordem.status === input.status) {
      throw new ConflictError("A ordem de serviço já está com esse status");
    }
    this.garantirNotificacaoFinalizada(ordem.historico[ordem.historico.length - 1]);

    const notificacao = this.novaTentativa();
    const resultado = await this.writeRepo.addEvento(
      ordemId,
      { status: input.status, data, motivo, notificacao },
      ordem.historicoVersao,
    );
    const mutacao = this.obtemMutacao(resultado, "Ordem de serviço não encontrada");
    return this.processarNotificacao(mutacao);
  }

  async updateEvento(ordemId: string, eventoId: string, dados: EventoAtualizacao): Promise<Evento> {
    if (dados.status === undefined && dados.data === undefined && dados.motivo === undefined) {
      throw new ValidationError("Informe 'status', 'data' ou 'motivo' para atualizar o evento");
    }
    if (dados.status !== undefined) this.garantirStatus(dados.status);
    if (dados.data !== undefined) this.garantirData(dados.data);

    const ordem = await this.getById(ordemId);
    const indice = ordem.historico.findIndex((evento) => evento.id === eventoId);
    if (indice < 0) throw new NotFoundError("Evento não encontrado");
    const anterior = ordem.historico[indice];
    this.garantirNotificacaoFinalizada(anterior);

    const status = dados.status ?? anterior.status;
    const statusMudou = status !== anterior.status;
    const motivo = statusMudou || dados.motivo !== undefined
      ? this.normalizaMotivo(status, dados.motivo)
      : anterior.motivo;
    this.garantirSequenciaValida(ordem, indice, status);

    const ehUltimo = indice === ordem.historico.length - 1;
    const deveNotificar = ehUltimo && statusMudou;
    const atualizacao: EventoAtualizacao = { ...dados, motivo };
    let statusOrdem: EStatus | undefined;
    if (ehUltimo && statusMudou) {
      statusOrdem = status;
      atualizacao.notificacao = this.novaTentativa();
    }

    const resultado = await this.writeRepo.updateEvento(
      ordemId,
      eventoId,
      atualizacao,
      ordem.historicoVersao,
      statusOrdem,
    );
    const mutacao = this.obtemMutacao(resultado, "Evento não encontrado");
    if (deveNotificar) return this.processarNotificacao(mutacao);
    return mutacao.evento;
  }

  async removeEvento(ordemId: string, eventoId: string): Promise<void> {
    const ordem = await this.getById(ordemId);
    const indice = ordem.historico.findIndex((evento) => evento.id === eventoId);
    if (indice < 0) throw new NotFoundError("Evento não encontrado");
    if (ordem.historico.length === 1) {
      throw new ConflictError("A ordem de serviço deve manter pelo menos um evento");
    }
    this.garantirNotificacaoFinalizada(ordem.historico[indice]);
    this.garantirRemocaoSemDuplicidade(ordem, indice);

    const ehUltimo = indice === ordem.historico.length - 1;
    let statusOrdem: EStatus | undefined;
    if (ehUltimo) statusOrdem = ordem.historico[indice - 1].status;

    const resultado = await this.writeRepo.removeEvento(
      ordemId,
      eventoId,
      ordem.historicoVersao,
      statusOrdem,
    );
    this.obtemMutacao(resultado, "Evento não encontrado");
  }

  async reenviarNotificacao(ordemId: string, eventoId: string): Promise<Evento> {
    const ordem = await this.getById(ordemId);
    const ultimo = ordem.historico[ordem.historico.length - 1];
    if (!ultimo || ultimo.id !== eventoId || ultimo.status !== ordem.status) {
      throw new ConflictError("Somente a notificação do evento atual pode ser reenviada");
    }
    if (ultimo.notificacao.status === EStatusNotificacao.ENVIADA) {
      throw new ConflictError("A notificação deste evento já foi enviada");
    }
    if (ultimo.notificacao.status === EStatusNotificacao.NAO_APLICAVEL) {
      throw new ConflictError("Este evento não possui notificação para reenviar");
    }

    const pendenteAntesDe = new Date(Date.now() - TEMPO_PENDENTE_MS);
    if (
      ultimo.notificacao.status === EStatusNotificacao.PENDENTE
      && ultimo.notificacao.ultimaTentativaEm
      && ultimo.notificacao.ultimaTentativaEm > pendenteAntesDe
    ) {
      throw new ConflictError("A notificação deste evento ainda está em processamento");
    }

    const resultado = await this.writeRepo.claimNotificacao(
      ordemId,
      eventoId,
      ordem.historicoVersao,
      this.novaTentativa(),
      pendenteAntesDe,
    );
    const mutacao = this.obtemMutacao(resultado, "Evento não encontrado");
    return this.processarNotificacao(mutacao);
  }

  private garantirStatus(status: unknown): asserts status is EStatus {
    if (!Object.values(EStatus).includes(status as EStatus)) {
      throw new ValidationError("Campo 'status' é inválido");
    }
  }

  private garantirData(data: unknown): Date {
    if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
      throw new ValidationError("Campo 'data' é inválido");
    }
    return data;
  }

  private async processarNotificacao(mutacao: EventoMutado): Promise<Evento> {
    const tentativaId = mutacao.evento.notificacao.tentativaId;
    if (!tentativaId) {
      throw new AppError("Tentativa de notificação não identificada", 500);
    }

    try {
      await this.notificarStatus(mutacao.ordem, mutacao.evento);
    } catch (erro) {
      const resultadoEnvio = this.resultadoDaFalha(erro);
      const finalizacao = await this.writeRepo.finalizarNotificacao(
        mutacao.ordem.id,
        mutacao.evento.id,
        tentativaId,
        EStatusNotificacao.FALHA,
        resultadoEnvio,
      );
      const evento = this.obtemFinalizacao(finalizacao, mutacao.evento.id);
      throw new NotificationError(evento.id, resultadoEnvio);
    }

    const finalizacao = await this.writeRepo.finalizarNotificacao(
      mutacao.ordem.id,
      mutacao.evento.id,
      tentativaId,
      EStatusNotificacao.ENVIADA,
      null,
    );
    return this.obtemFinalizacao(finalizacao, mutacao.evento.id);
  }

  private async notificarStatus(ordem: OrdemServico, evento: Evento): Promise<void> {
    const veiculo = await this.veiculoRepo.findById(ordem.veiculoId);
    if (!veiculo) throw new ValidationError("Veículo não encontrado");
    const cliente = await this.clienteRepo.findById(ordem.clienteId);
    if (!cliente) throw new ValidationError("Cliente não encontrado");

    const campos = {
      nomeCliente: cliente.nome,
      veiculo: `${veiculo.marca} ${veiculo.modelo} ${veiculo.placa}`,
      data: this.formataData(evento.data),
      status: evento.status,
      motivo: evento.motivo ?? undefined,
    };
    await this.whatsapp.enviar({
      para: this.telefoneParaEnvio(cliente.telefone),
      template: TEMPLATE_POR_STATUS[evento.status],
      campos,
    });
  }

  private resultadoDaFalha(erro: unknown): EResultadoEnvio {
    if (erro instanceof WhatsappTemplateError) return erro.resultadoEnvio;
    if (erro instanceof ValidationError) return EResultadoEnvio.REJEITADO;
    console.error("Falha inesperada ao enviar WhatsApp da ordem de serviço", erro);
    return EResultadoEnvio.INCERTO;
  }

  private obtemFinalizacao(
    resultado: ResultadoMutacao<EventoMutado>,
    eventoId: string,
  ): Evento {
    if (resultado.tipo === "sucesso") return resultado.valor.evento;
    throw new AppError(
      "Não foi possível registrar o resultado da notificação",
      500,
      { eventoId, resultadoEnvio: EResultadoEnvio.INCERTO },
    );
  }

  private obtemMutacao<T>(resultado: ResultadoMutacao<T>, mensagemNaoEncontrado: string): T {
    if (resultado.tipo === "sucesso") return resultado.valor;
    if (resultado.tipo === "nao_encontrado") {
      throw new NotFoundError(mensagemNaoEncontrado);
    }
    throw new ConflictError("O histórico foi alterado por outra operação; tente novamente");
  }

  private formataData(data: Date): string {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(data);
  }

  private telefoneParaEnvio(telefone: string | undefined): string {
    const digitos = typeof telefone === "string" ? telefone.replace(/\D/g, "") : "";
    if (!/^\d{10,11}$/.test(digitos)) {
      throw new ValidationError("Cliente sem telefone nacional válido para WhatsApp");
    }
    return `55${digitos}`;
  }

  private async garantirVinculo(veiculoId: string, clienteId: string): Promise<void> {
    const veiculo = await this.veiculoRepo.findById(veiculoId);
    if (!veiculo) throw new ValidationError("Veículo não encontrado");
    const cliente = await this.clienteRepo.findById(clienteId);
    if (!cliente) throw new ValidationError("Cliente não encontrado");
    if (veiculo.dono !== clienteId) {
      throw new ValidationError("Veículo não pertence ao cliente");
    }
  }

  private normalizaMotivo(status: EStatus, motivo: string | undefined | null): string | null {
    const texto = typeof motivo === "string" ? motivo.trim() : "";
    if (STATUS_COM_MOTIVO.includes(status) && !texto) {
      throw new ValidationError("Campo 'motivo' é obrigatório para este status");
    }
    if (!STATUS_COM_MOTIVO.includes(status)) return null;
    return texto;
  }

  private notificacaoNaoAplicavel(): NotificacaoEvento {
    return {
      status: EStatusNotificacao.NAO_APLICAVEL,
      tentativaId: null,
      ultimaTentativaEm: null,
      resultadoEnvio: null,
    };
  }

  private novaTentativa(): NotificacaoEvento {
    return {
      status: EStatusNotificacao.PENDENTE,
      tentativaId: randomUUID(),
      ultimaTentativaEm: new Date(),
      resultadoEnvio: null,
    };
  }

  private garantirNotificacaoFinalizada(evento: Evento | undefined): void {
    if (evento?.notificacao.status === EStatusNotificacao.PENDENTE) {
      throw new ConflictError("A notificação do evento ainda está em processamento");
    }
  }

  private garantirSequenciaValida(ordem: OrdemServico, indice: number, status: EStatus): void {
    const anterior = ordem.historico[indice - 1];
    const proximo = ordem.historico[indice + 1];
    if (anterior?.status === status || proximo?.status === status) {
      throw new ConflictError("A alteração criaria eventos consecutivos com o mesmo status");
    }
  }

  private garantirRemocaoSemDuplicidade(ordem: OrdemServico, indice: number): void {
    const anterior = ordem.historico[indice - 1];
    const proximo = ordem.historico[indice + 1];
    if (anterior && proximo && anterior.status === proximo.status) {
      throw new ConflictError("A remoção criaria eventos consecutivos com o mesmo status");
    }
  }
}
