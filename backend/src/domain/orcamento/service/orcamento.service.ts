import { NotFoundError } from "../../common/errors/app-error";
import { Orcamento, OrcamentoInput } from "../entity/orcamento.entity";
import { OrcamentoRepositoryRead } from "../repository/orcamento.repository.read";
import { OrcamentoRepositoryWrite } from "../repository/orcamento.repository.write";

export class OrcamentoService {
  constructor(
    private readonly readRepo: OrcamentoRepositoryRead,
    private readonly writeRepo: OrcamentoRepositoryWrite,
  ) {}

  list(): Promise<Orcamento[]> {
    return this.readRepo.list();
  }

  async getById(id: string): Promise<Orcamento> {
    const orcamento = await this.readRepo.findById(id);
    if (!orcamento) throw new NotFoundError("Orçamento não encontrado");
    return orcamento;
  }

  create(input: OrcamentoInput): Promise<Orcamento> {
    return this.writeRepo.create(input);
  }

  async update(id: string, input: OrcamentoInput): Promise<Orcamento> {
    const atualizado = await this.writeRepo.update(id, input);
    if (!atualizado) throw new NotFoundError("Orçamento não encontrado");
    return atualizado;
  }

  async delete(id: string): Promise<void> {
    const removido = await this.writeRepo.delete(id);
    if (!removido) throw new NotFoundError("Orçamento não encontrado");
  }
}