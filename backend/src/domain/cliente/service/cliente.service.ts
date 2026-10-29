import { AppError, NotFoundError, ValidationError } from "../../common/errors/app-error";
import { OrcamentoRepositoryRead } from "../../orcamento/repository/orcamento.repository.read";
import { VeiculoRepositoryRead } from "../../veiculo/repository/veiculo.repository.read";
import { Cliente, ClienteInput } from "../entity/cliente.entity";
import { ClienteRepositoryRead } from "../repository/cliente.repository.read";
import { ClienteRepositoryWrite } from "../repository/cliente.repository.write";

export type ClienteCreateFromOrcamento = {
  orcamentoId: string;
  documento: string;
  email: string;
};

export class ClienteService {
  constructor(
    private readonly readRepo: ClienteRepositoryRead,
    private readonly writeRepo: ClienteRepositoryWrite,
    private readonly veiculoRepo: VeiculoRepositoryRead,
    private readonly orcamentoRepo: OrcamentoRepositoryRead,
  ) {}

  list(): Promise<Cliente[]> {
    return this.readRepo.list();
  }

  async getById(id: string): Promise<Cliente> {
    const cliente = await this.readRepo.findById(id);
    if (!cliente) throw new NotFoundError("Cliente não encontrado");
    return cliente;
  }

  async create(input: ClienteInput): Promise<Cliente> {
    const data = this.normaliza(input);
    await this.garantirEmailLivre(data.email);
    await this.garantirDocumentoLivre(data.documento);
    return this.writeRepo.create(data);
  }

  async createFromOrcamento(input: ClienteCreateFromOrcamento): Promise<Cliente> {
    const orcamento = await this.orcamentoRepo.findById(input.orcamentoId);
    if (!orcamento) throw new NotFoundError("Orçamento não encontrado");
    if (!orcamento.nome || !orcamento.telefone) {
      throw new ValidationError("Orçamento precisa de nome e telefone para criar o cliente");
    }
    return this.create({
      nome: orcamento.nome,
      telefone: orcamento.telefone,
      documento: input.documento,
      email: input.email,
    });
  }

  async update(id: string, input: ClienteInput): Promise<Cliente> {
    await this.getById(id);
    const data = this.normaliza(input);
    await this.garantirEmailLivre(data.email, id);
    await this.garantirDocumentoLivre(data.documento, id);
    const atualizado = await this.writeRepo.update(id, data);
    if (!atualizado) throw new NotFoundError("Cliente não encontrado");
    return atualizado;
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    if (await this.veiculoRepo.existsByClienteId(id)) {
      throw new AppError("Cliente possui veículos vinculados", 409);
    }
    await this.writeRepo.delete(id);
  }

  private normaliza(input: ClienteInput): ClienteInput {
    return {
      nome: input.nome.trim(),
      documento: input.documento.trim(),
      email: input.email.trim(),
      telefone: input.telefone.trim(),
    };
  }

  private async garantirEmailLivre(email: string, ignorarId?: string) {
    const existente = await this.readRepo.findByEmail(email);
    if (existente && existente.id !== ignorarId) {
      throw new AppError("Já existe um cliente com esse e-mail", 409);
    }
  }

  private async garantirDocumentoLivre(documento: string, ignorarId?: string) {
    const existente = await this.readRepo.findByDocumento(documento);
    if (existente && existente.id !== ignorarId) {
      throw new AppError("Já existe um cliente com esse documento", 409);
    }
  }
}
