import { NotFoundError, ValidationError } from "../../common/errors/app-error";
import { Cliente } from "../../cliente/entity/cliente.entity";
import { ClienteRepositoryRead } from "../../cliente/repository/cliente.repository.read";
import { Veiculo } from "../../veiculo/entity/veiculo.entity";
import { VeiculoRepositoryRead } from "../../veiculo/repository/veiculo.repository.read";
import { EStatus } from "../entity/e-status";
import { Evento, EventoAtualizacao } from "../entity/evento.entity";
import {
  OrdemServico,
  OrdemServicoAtualizacao,
  OrdemServicoInput,
  OrdemServicoUpdateInput,
} from "../entity/ordem-servico.entity";
import { TemplateWhatsapp } from "../entity/template-whatsapp";
import { WhatsappTemplateGateway } from "../gateway/whatsapp-template.gateway";
import { OrdemServicoRepositoryRead } from "../repository/ordem-servico.repository.read";
import { OrdemServicoRepositoryWrite } from "../repository/ordem-servico.repository.write";

const TEMPLATE_POR_STATUS: Record<EStatus, TemplateWhatsapp> = {
  [EStatus.EM_ESPERA]: TemplateWhatsapp.EmEspera,
  [EStatus.DIAGNOSTICO]: TemplateWhatsapp.Diagnostico,
  [EStatus.EM_SERVICO]: TemplateWhatsapp.EmServico,
  [EStatus.AGUARDANDO_PECA]: TemplateWhatsapp.AguardandoPeca,
  [EStatus.FINALIZADO]: TemplateWhatsapp.Finalizado,
};

export type NovoEvento = {
  status: EStatus;
  data?: Date;
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
    return this.writeRepo.create({
      veiculoId: input.veiculoId,
      clienteId: input.clienteId,
      decisao: input.decisao,
      decisaoData: agora,
      descricao: input.descricao.trim(),
      orcamento: this.orcamentoEmCentavos(input.orcamento),
      status: input.status,
      historico: [{ status: input.status, data: agora }],
      itens: input.itens,
    });
  }

  // Não altera status nem historico: o status só muda pelos eventos.
  async update(id: string, input: OrdemServicoUpdateInput): Promise<OrdemServico> {
    const atual = await this.getById(id);
    await this.garantirVinculo(input.veiculoId, input.clienteId);

    const gravacao: OrdemServicoAtualizacao = {
      veiculoId: input.veiculoId,
      clienteId: input.clienteId,
      decisao: input.decisao,
      decisaoData: atual.decisao === input.decisao ? atual.decisaoData : new Date(),
      descricao: input.descricao.trim(),
      orcamento: this.orcamentoEmCentavos(input.orcamento),
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

  // ---- Eventos (histórico de status, subdocumentos de OrdemServico.historico) ----
  // O "último evento" é o último por ordem de inserção no array. OrdemServico.status
  // sempre reflete esse último evento e é gravado na mesma operação do evento.

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

  // Grava primeiro e notifica depois; falha no WhatsApp não desfaz o evento.
  async addEvento(ordemId: string, input: NovoEvento): Promise<Evento> {
    this.garantirStatus(input.status);
    const data = input.data === undefined ? new Date() : this.garantirData(input.data);
    const ordem = await this.getById(ordemId);

    const evento = await this.writeRepo.addEvento(ordemId, { status: input.status, data }, input.status);
    if (!evento) throw new NotFoundError("Ordem de serviço não encontrada");

    await this.notificarStatus(ordem, evento);
    return evento;
  }

  async updateEvento(ordemId: string, eventoId: string, dados: EventoAtualizacao): Promise<Evento> {
    if (dados.status === undefined && dados.data === undefined) {
      throw new ValidationError("Informe 'status' ou 'data' para atualizar o evento");
    }
    if (dados.status !== undefined) this.garantirStatus(dados.status);
    if (dados.data !== undefined) this.garantirData(dados.data);

    const ordem = await this.getById(ordemId);
    const indice = ordem.historico.findIndex((e) => e.id === eventoId);
    if (indice < 0) throw new NotFoundError("Evento não encontrado");
    const anterior = ordem.historico[indice];
    const ehUltimo = indice === ordem.historico.length - 1;
    const statusOrdem = ehUltimo ? dados.status : undefined;

    const atualizado = await this.writeRepo.updateEvento(ordemId, eventoId, dados, statusOrdem);
    if (!atualizado) throw new NotFoundError("Evento não encontrado");

    if (ehUltimo && dados.status !== undefined && dados.status !== anterior.status) {
      await this.notificarStatus(ordem, atualizado);
    }
    return atualizado;
  }

  // Removendo o último, a OS volta ao status do evento anterior.
  // Se o histórico ficar vazio, o status atual da OS é mantido.
  async removeEvento(ordemId: string, eventoId: string): Promise<void> {
    const ordem = await this.getById(ordemId);
    const indice = ordem.historico.findIndex((e) => e.id === eventoId);
    if (indice < 0) throw new NotFoundError("Evento não encontrado");
    const ehUltimo = indice === ordem.historico.length - 1;
    const statusOrdem = ehUltimo && indice > 0 ? ordem.historico[indice - 1].status : undefined;

    const removido = await this.writeRepo.removeEvento(ordemId, eventoId, statusOrdem);
    if (!removido) throw new NotFoundError("Evento não encontrado");
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

  private async notificarStatus(ordem: OrdemServico, evento: Evento): Promise<void> {
    try {
      const veiculo = await this.veiculoRepo.findById(ordem.veiculoId);
      if (!veiculo) throw new ValidationError("Veículo não encontrado");
      const cliente = await this.clienteRepo.findById(ordem.clienteId);
      if (!cliente) throw new ValidationError("Cliente não encontrado");
      await this.whatsapp.enviar({
        para: this.telefoneParaEnvio(cliente.telefone),
        template: TEMPLATE_POR_STATUS[evento.status],
        campos: {
          nomeCliente: cliente.nome,
          veiculo: `${veiculo.marca} ${veiculo.modelo} ${veiculo.placa}`,
          data: this.formataData(evento.data),
          status: evento.status,
        },
      });
    } catch (erro) {
      console.error("Falha ao enviar WhatsApp do evento da ordem de serviço", erro);
    }
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

  private telefoneParaEnvio(telefone: string): string {
    const digitos = telefone.replace(/\D/g, "");
    if (!digitos) throw new ValidationError("Cliente sem telefone válido para WhatsApp");
    return digitos;
  }

  private async garantirVinculo(veiculoId: string, clienteId: string): Promise<{ veiculo: Veiculo; cliente: Cliente }> {
    const veiculo = await this.veiculoRepo.findById(veiculoId);
    if (!veiculo) throw new ValidationError("Veículo não encontrado");
    const cliente = await this.clienteRepo.findById(clienteId);
    if (!cliente) throw new ValidationError("Cliente não encontrado");
    if (veiculo.dono !== clienteId) {
      throw new ValidationError("Veículo não pertence ao cliente");
    }
    return { veiculo, cliente };
  }

  private orcamentoEmCentavos(reais: number): number {
    return Math.round(reais * 100);
  }
}
