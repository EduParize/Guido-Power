import { AppError, NotFoundError, ValidationError } from "../../common/errors/app-error";
import { UsuarioRepositoryRead } from "../../usuario/repository/usuario.repository.read";
import { OrdemServicoRepositoryRead } from "../../ordem-servico/repository/ordem-servico.repository.read";
import { Veiculo, VeiculoInput } from "../entity/veiculo.entity";
import { VeiculoRepositoryRead } from "../repository/veiculo.repository.read";
import { VeiculoRepositoryWrite } from "../repository/veiculo.repository.write";

const normalizaPlaca = (placa: string) =>
  placa.replace(/[\s-]/g, "").toUpperCase();

export class VeiculoService {
  constructor(
    private readonly readRepo: VeiculoRepositoryRead,
    private readonly writeRepo: VeiculoRepositoryWrite,
    private readonly usuarioRepo: UsuarioRepositoryRead,
    private readonly ordemRepo: OrdemServicoRepositoryRead,
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

  async update(id: string, input: VeiculoInput): Promise<Veiculo> {
    await this.getById(id); // 404 se não existir
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
    const dono = await this.usuarioRepo.findById(donoId);
    if (!dono) throw new ValidationError("Cliente (dono) não encontrado");
  }

  private async garantirPlacaLivre(placa: string, ignorarId?: string) {
    const existente = await this.readRepo.findByPlaca(placa);
    if (existente && existente.id !== ignorarId) {
      throw new AppError("Já existe um veículo com essa placa", 409);
    }
  }
}