import { Orcamento, OrcamentoGravacao } from "../entity/orcamento.entity";

export interface OrcamentoRepositoryWrite {
  create(data: OrcamentoGravacao): Promise<Orcamento>;
  update(id: string, data: OrcamentoGravacao): Promise<Orcamento | null>;
  delete(id: string): Promise<boolean>;
}
