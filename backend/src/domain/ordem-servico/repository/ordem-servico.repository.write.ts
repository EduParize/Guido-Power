import { EStatus } from "../entity/e-status";
import {
  EResultadoEnvio,
  EStatusNotificacao,
  Evento,
  EventoAtualizacao,
  EventoInput,
  NotificacaoEvento,
} from "../entity/evento.entity";
import { OrdemServico, OrdemServicoAtualizacao, OrdemServicoCriacao } from "../entity/ordem-servico.entity";

export type ResultadoMutacao<T> =
  | { tipo: "sucesso"; valor: T }
  | { tipo: "nao_encontrado" }
  | { tipo: "conflito" };

export type EventoMutado = {
  ordem: OrdemServico;
  evento: Evento;
};

export interface OrdemServicoRepositoryWrite {
  create(data: OrdemServicoCriacao): Promise<OrdemServico>;
  update(id: string, data: OrdemServicoAtualizacao): Promise<OrdemServico | null>;
  delete(id: string): Promise<boolean>;
  addEvento(
    ordemId: string,
    evento: EventoInput,
    historicoVersao: number,
  ): Promise<ResultadoMutacao<EventoMutado>>;
  updateEvento(
    ordemId: string,
    eventoId: string,
    dados: EventoAtualizacao,
    historicoVersao: number,
    statusOrdem?: EStatus,
  ): Promise<ResultadoMutacao<EventoMutado>>;
  removeEvento(
    ordemId: string,
    eventoId: string,
    historicoVersao: number,
    statusOrdem?: EStatus,
  ): Promise<ResultadoMutacao<OrdemServico>>;
  claimNotificacao(
    ordemId: string,
    eventoId: string,
    historicoVersao: number,
    notificacao: NotificacaoEvento,
    pendenteAntesDe: Date,
  ): Promise<ResultadoMutacao<EventoMutado>>;
  finalizarNotificacao(
    ordemId: string,
    eventoId: string,
    tentativaId: string,
    status: EStatusNotificacao.ENVIADA | EStatusNotificacao.FALHA,
    resultadoEnvio: EResultadoEnvio | null,
  ): Promise<ResultadoMutacao<EventoMutado>>;
}
