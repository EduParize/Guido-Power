import { OrdemServico } from "../entity/ordem-servico.entity";

export interface OrdemServicoRepositoryRead {
  findById(id: string): Promise<OrdemServico | null>;
  list(): Promise<OrdemServico[]>;
  existsByVeiculoId(veiculoId: string): Promise<boolean>;
}
