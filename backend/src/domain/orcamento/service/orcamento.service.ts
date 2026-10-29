import { ConflictError, NotFoundError } from "../../common/errors/app-error";
import { OrdemServicoRepositoryRead } from "../../ordem-servico/repository/ordem-servico.repository.read";
import { EDecisao } from "../entity/e-decisao";
import {
  Orcamento,
  OrcamentoCreateInput,
  OrcamentoGravacao,
  OrcamentoInput,
  totalCentavosDosItens,
} from "../entity/orcamento.entity";
import { OrcamentoRepositoryRead } from "../repository/orcamento.repository.read";
import { OrcamentoRepositoryWrite } from "../repository/orcamento.repository.write";

export class OrcamentoService {
  constructor(
    private readonly readRepo: OrcamentoRepositoryRead,
    private readonly writeRepo: OrcamentoRepositoryWrite,
    private readonly ordemReadRepo: OrdemServicoRepositoryRead,
  ) {}

  list(): Promise<Orcamento[]> {
    return this.readRepo.list();
  }

  async getById(id: string): Promise<Orcamento> {
    const orcamento = await this.readRepo.findById(id);
    if (!orcamento) throw new NotFoundError("Orçamento não encontrado");
    return orcamento;
  }

  create(input: OrcamentoCreateInput): Promise<Orcamento> {
    const agora = new Date();
    return this.writeRepo.create(
      this.paraGravacao({ ...input, decisao: EDecisao.PENDENTE }, agora),
    );
  }

  async update(id: string, input: OrcamentoInput): Promise<Orcamento> {
    const atual = await this.getById(id);
    const data = this.normaliza(input);
    if (
      data.decisao !== EDecisao.APROVADO
      && await this.ordemReadRepo.existsByOrcamentoId(id)
    ) {
      throw new ConflictError("Orçamento vinculado a uma ordem de serviço deve permanecer aprovado");
    }
    const decisaoData = data.decisao === atual.decisao ? atual.decisaoData : new Date();
    const atualizado = await this.writeRepo.update(id, this.paraGravacao(data, decisaoData));
    if (!atualizado) throw new NotFoundError("Orçamento não encontrado");
    return atualizado;
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    if (await this.ordemReadRepo.existsByOrcamentoId(id)) {
      throw new ConflictError("Orçamento vinculado a uma ordem de serviço");
    }
    const removido = await this.writeRepo.delete(id);
    if (!removido) throw new NotFoundError("Orçamento não encontrado");
  }

  private normaliza(input: OrcamentoInput): OrcamentoInput {
    const itens = input.itens;
    return {
      nome: input.nome?.trim() || null,
      telefone: input.telefone?.trim() || null,
      placa: input.placa?.trim().toUpperCase() || null,
      decisao: input.decisao,
      valorCentavos: totalCentavosDosItens(itens),
      itens,
    };
  }

  private paraGravacao(input: OrcamentoInput, decisaoData: Date): OrcamentoGravacao {
    return { ...this.normaliza(input), decisaoData };
  }
}
