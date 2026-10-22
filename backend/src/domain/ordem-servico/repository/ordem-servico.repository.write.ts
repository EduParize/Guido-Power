import { EStatus } from "../entity/e-status";
import { Evento, EventoAtualizacao, EventoInput } from "../entity/evento.entity";
import { OrdemServico, OrdemServicoAtualizacao, OrdemServicoCriacao } from "../entity/ordem-servico.entity";

export interface OrdemServicoRepositoryWrite {
  create(data: OrdemServicoCriacao): Promise<OrdemServico>;
  update(id: string, data: OrdemServicoAtualizacao): Promise<OrdemServico | null>;
  delete(id: string): Promise<boolean>;
  // statusOrdem, quando informado, é gravado em OrdemServico.status na mesma operação.
  addEvento(ordemId: string, evento: EventoInput, statusOrdem?: EStatus): Promise<Evento | null>;
  updateEvento(ordemId: string, eventoId: string, dados: EventoAtualizacao, statusOrdem?: EStatus): Promise<Evento | null>;
  removeEvento(ordemId: string, eventoId: string, statusOrdem?: EStatus): Promise<boolean>;
}
