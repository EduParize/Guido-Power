import { Orcamento, OrcamentoInput } from "../entity/orcamento.entity";

export interface OrcamentoRepositoryWrite {
  create(data: OrcamentoInput): Promise<Orcamento>;
  update(id: string, data: OrcamentoInput): Promise<Orcamento | null>;
  delete(id: string): Promise<boolean>;
}