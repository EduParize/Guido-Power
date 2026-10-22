import { EStatus } from "./e-status";

export enum EStatusNotificacao {
  NAO_APLICAVEL = "NAO_APLICAVEL",
  PENDENTE = "PENDENTE",
  ENVIADA = "ENVIADA",
  FALHA = "FALHA",
}

export enum EResultadoEnvio {
  REJEITADO = "REJEITADO",
  INCERTO = "INCERTO",
}

export type NotificacaoEvento = {
  status: EStatusNotificacao;
  tentativaId: string | null;
  ultimaTentativaEm: Date | null;
  resultadoEnvio: EResultadoEnvio | null;
};

export type Evento = {
  id: string;
  status: EStatus;
  data: Date;
  motivo: string | null;
  notificacao: NotificacaoEvento;
};

export type EventoInput = Omit<Evento, "id">;

export type EventoAtualizacao = Partial<Pick<Evento, "status" | "data" | "motivo" | "notificacao">>;
