import { EStatus } from "./e-status";

// Evento do histórico de status. É subdocumento de OrdemServico.historico,
// não tem collection própria.
export type Evento = {
  id: string;
  status: EStatus;
  data: Date;
};

export type EventoInput = Omit<Evento, "id">;

export type EventoAtualizacao = Partial<EventoInput>;
