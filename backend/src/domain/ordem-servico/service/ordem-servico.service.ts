import { NotFoundError, ValidationError } from "../../common/errors/app-error";
import { Cliente } from "../../cliente/entity/cliente.entity";
import { ClienteRepositoryRead } from "../../cliente/repository/cliente.repository.read";
import { Veiculo } from "../../veiculo/entity/veiculo.entity";
import { VeiculoRepositoryRead } from "../../veiculo/repository/veiculo.repository.read";
import {
  OrdemServico,
  OrdemServicoAtualizacao,
  OrdemServicoInput,
  OrdemServicoUpdateInput,
} from "../entity/ordem-servico.entity";
import { WhatsappTemplateGateway } from "../gateway/whatsapp-template.gateway";
import { OrdemServicoRepositoryRead } from "../repository/ordem-servico.repository.read";
import { OrdemServicoRepositoryWrite } from "../repository/ordem-servico.repository.write";

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
