import { OrdemServico, OrdemServicoAtualizacao, OrdemServicoCriacao } from "../entity/ordem-servico.entity";

export interface OrdemServicoRepositoryWrite {
  create(data: OrdemServicoCriacao): Promise<OrdemServico>;
  update(id: string, data: OrdemServicoAtualizacao): Promise<OrdemServico | null>;
  delete(id: string): Promise<boolean>;
}
