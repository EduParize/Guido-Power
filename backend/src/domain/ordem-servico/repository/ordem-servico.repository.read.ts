import { Evento } from "../entity/evento.entity";
import { OrdemServico } from "../entity/ordem-servico.entity";

export interface OrdemServicoRepositoryRead {
  findById(id: string): Promise<OrdemServico | null>;
  list(): Promise<OrdemServico[]>;
  existsByVeiculoId(veiculoId: string): Promise<boolean>;
  // null quando a ordem não existe.
  listEventos(ordemId: string): Promise<Evento[] | null>;
  findEventoById(ordemId: string, eventoId: string): Promise<Evento | null>;
}
