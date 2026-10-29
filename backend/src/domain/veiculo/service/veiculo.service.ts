import { AppError, NotFoundError, ValidationError } from "../../common/errors/app-error";
import { ClienteRepositoryRead } from "../../cliente/repository/cliente.repository.read";
import { OrcamentoRepositoryRead } from "../../orcamento/repository/orcamento.repository.read";
import { OrdemServicoRepositoryRead } from "../../ordem-servico/repository/ordem-servico.repository.read";
import { Veiculo, VeiculoInput } from "../entity/veiculo.entity";
import { VeiculoRepositoryRead } from "../repository/veiculo.repository.read";
import { VeiculoRepositoryWrite } from "../repository/veiculo.repository.write";

const normalizaPlaca = (placa: string) =>
  placa.replace(/[\s-]/g, "").toUpperCase();

export type VeiculoCreateFromOrcamento = {
  orcamentoId: string;
  dono: string;
  marca: string;
  modelo: string;
  ano: string;
};

export class VeiculoService {
  constructor(
    private readonly readRepo: VeiculoRepositoryRead,
    private readonly writeRepo: VeiculoRepositoryWrite,
    private readonly clienteRepo: ClienteRepositoryRead,
    private readonly ordemRepo: OrdemServicoRepositoryRead,
    private readonly orcamentoRepo: OrcamentoRepositoryRead,
  ) {}

  list(clienteId?: string): Promise<Veiculo[]> {
    return clienteId
      ? this.readRepo.listByClienteId(clienteId)
      : this.readRepo.list();
  }

  async getById(id: string): Promise<Veiculo> {
    const veiculo = await this.readRepo.findById(id);
    if (!veiculo) throw new NotFoundError("Veículo não encontrado");
    return veiculo;
  }

  async create(input: VeiculoInput): Promise<Veiculo> {
    const data = { ...input, placa: normalizaPlaca(input.placa) };
    await this.garantirDonoExiste(data.dono);
    await this.garantirPlacaLivre(data.placa);
    return this.writeRepo.create(data);
  }

  async createFromOrcamento(input: VeiculoCreateFromOrcamento): Promise<Veiculo> {
    const orcamento = await this.orcamentoRepo.findById(input.orcamentoId);
    if (!orcamento) throw new NotFoundError("Orçamento não encontrado");
    if (!orcamento.placa) {
      throw new ValidationError("Orçamento precisa de placa para criar o veículo");
    }
    return this.create({
      dono: input.dono,
      marca: input.marca,
      modelo: input.modelo,
      ano: input.ano,
      placa: orcamento.placa,
    });
  }

  async update(id: string, input: VeiculoInput): Promise<Veiculo> {
    await this.getById(id);
    const data = { ...input, placa: normalizaPlaca(input.placa) };
    await this.garantirDonoExiste(data.dono);
    await this.garantirPlacaLivre(data.placa, id);
    const atualizado = await this.writeRepo.update(id, data);
    if (!atualizado) throw new NotFoundError("Veículo não encontrado");
    return atualizado;
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    if (await this.ordemRepo.existsByVeiculoId(id)) {
      throw new AppError("Veículo possui ordens de serviço vinculadas", 409);
    }
    await this.writeRepo.delete(id);
  }

  private async garantirDonoExiste(donoId: string) {
    const dono = await this.clienteRepo.findById(donoId);
    if (!dono) throw new ValidationError("Cliente (dono) não encontrado");
  }

  private async garantirPlacaLivre(placa: string, ignorarId?: string) {
    const existente = await this.readRepo.findByPlaca(placa);
    if (existente && existente.id !== ignorarId) {
      throw new AppError("Já existe um veículo com essa placa", 409);
    }
  }
}
