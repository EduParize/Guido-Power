import { NotFoundError, ValidationError } from "../../common/errors/app-error";
import { Cliente } from "../../cliente/entity/cliente.entity";
import { ClienteRepositoryRead } from "../../cliente/repository/cliente.repository.read";
import { Veiculo } from "../../veiculo/entity/veiculo.entity";
import { VeiculoRepositoryRead } from "../../veiculo/repository/veiculo.repository.read";
import { EStatus } from "../entity/e-status";
import { OrdemServico, OrdemServicoGravacao, OrdemServicoInput } from "../entity/ordem-servico.entity";
import { TemplateWhatsapp } from "../entity/template-whatsapp";
import { CamposTemplate, WhatsappTemplateGateway } from "../gateway/whatsapp-template.gateway";
import { OrdemServicoRepositoryRead } from "../repository/ordem-servico.repository.read";
import { OrdemServicoRepositoryWrite } from "../repository/ordem-servico.repository.write";

const TEMPLATE_POR_STATUS: Record<EStatus, TemplateWhatsapp> = {
  [EStatus.AGUARDANDO_INICIO]: TemplateWhatsapp.AguardandoInicioDeServico,
  [EStatus.INICIADO]: TemplateWhatsapp.ServicoIniciado,
  [EStatus.PAUSADO]: TemplateWhatsapp.ServicoPausado,
  [EStatus.FINALIZADO]: TemplateWhatsapp.ServicoFinalizado,
  [EStatus.CANCELADO]: TemplateWhatsapp.ServicoCancelado,
};

const STATUS_COM_MOTIVO: EStatus[] = [EStatus.PAUSADO, EStatus.CANCELADO];

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

  async create(input: OrdemServicoInput): Promise<OrdemServico> {
    await this.garantirVinculo(input.veiculoId, input.clienteId);
    return this.writeRepo.create({
      veiculoId: input.veiculoId,
      clienteId: input.clienteId,
      decisao: input.decisao,
      decisaoData: new Date(),
      descricao: input.descricao.trim(),
      orcamento: this.orcamentoEmCentavos(input.orcamento),
      status: input.status,
      historico: [],
      itens: input.itens,
    });
  }

  async update(id: string, input: OrdemServicoInput): Promise<OrdemServico> {
    const atual = await this.getById(id);
    const { veiculo, cliente } = await this.garantirVinculo(input.veiculoId, input.clienteId);

    const statusMudou = atual.status !== input.status;
    let historico = atual.historico;
    if (statusMudou) {
      const motivo = this.motivoDaMudanca(input.status, input.motivo);
      const para = this.telefoneParaEnvio(cliente.telefone);
      const data = new Date();
      const campos: CamposTemplate = {
        nomeCliente: cliente.nome,
        veiculo: `${veiculo.marca} ${veiculo.modelo} ${veiculo.placa}`,
        data: this.formataData(data),
        status: input.status,
      };
      if (STATUS_COM_MOTIVO.includes(input.status) && motivo) {
        campos.motivo = motivo;
      }
      await this.whatsapp.enviar({
        para,
        template: TEMPLATE_POR_STATUS[input.status],
        campos,
      });
      historico = [...atual.historico, { data, status: input.status, motivo }];
    }

    const gravacao: OrdemServicoGravacao = {
      veiculoId: input.veiculoId,
      clienteId: input.clienteId,
      decisao: input.decisao,
      decisaoData: atual.decisao === input.decisao ? atual.decisaoData : new Date(),
      descricao: input.descricao.trim(),
      orcamento: this.orcamentoEmCentavos(input.orcamento),
      status: input.status,
      historico,
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

  private motivoDaMudanca(status: EStatus, motivo: string | undefined): string | null {
    const texto = typeof motivo === "string" ? motivo.trim() : "";
    if (STATUS_COM_MOTIVO.includes(status) && !texto) {
      throw new ValidationError("Campo 'motivo' é obrigatório");
    }
    if (!texto) return null;
    return texto;
  }

  private orcamentoEmCentavos(reais: number): number {
    return Math.round(reais * 100);
  }

  private telefoneParaEnvio(telefone: string): string {
    const digitos = telefone.replace(/\D/g, "");
    if (!digitos) throw new ValidationError("Cliente sem telefone válido para WhatsApp");
    return digitos;
  }
}
