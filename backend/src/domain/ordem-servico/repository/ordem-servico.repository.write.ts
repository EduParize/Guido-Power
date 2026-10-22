import { OrdemServico, OrdemServicoGravacao } from "../entity/ordem-servico.entity";

export interface OrdemServicoRepositoryWrite {
  create(data: OrdemServicoGravacao): Promise<OrdemServico>;
  update(id: string, data: OrdemServicoGravacao): Promise<OrdemServico | null>;
  delete(id: string): Promise<boolean>;
}
