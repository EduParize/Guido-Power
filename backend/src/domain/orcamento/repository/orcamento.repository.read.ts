import { Orcamento } from "../entity/orcamento.entity";

export interface OrcamentoRepositoryRead {
  findById(id: string): Promise<Orcamento | null>;
  list(): Promise<Orcamento[]>;
}