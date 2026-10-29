import { Types } from "mongoose";
import { EStatus } from "../../../../domain/ordem-servico/entity/e-status";
import {
  EResultadoEnvio,
  EStatusNotificacao,
  Evento,
  EventoInput,
} from "../../../../domain/ordem-servico/entity/evento.entity";
import {
  OrdemServico,
  OrdemServicoAtualizacao,
  OrdemServicoCriacao,
} from "../../../../domain/ordem-servico/entity/ordem-servico.entity";
import { OrdemServicoDocument } from "../../../db/mongo/schema/ordem-servico.schema";

export type EventoDocument = {
  _id: Types.ObjectId;
  data: Date;
  status: string;
  motivo?: string | null;
  notificacao: {
    status: string;
    tentativaId?: string | null;
    ultimaTentativaEm?: Date | null;
    resultadoEnvio?: string | null;
  };
};

export function toEvento(evento: EventoDocument): Evento {
  return {
    id: evento._id.toString(),
    status: evento.status as EStatus,
    data: evento.data,
    motivo: evento.motivo ?? null,
    notificacao: {
      status: evento.notificacao.status as EStatusNotificacao,
      tentativaId: evento.notificacao.tentativaId ?? null,
      ultimaTentativaEm: evento.notificacao.ultimaTentativaEm ?? null,
      resultadoEnvio: (evento.notificacao.resultadoEnvio as EResultadoEnvio | undefined) ?? null,
    },
  };
}

export function toOrdemServico(doc: OrdemServicoDocument): OrdemServico {
  return {
    id: doc._id.toString(),
    veiculoId: doc.veiculoId.toString(),
    clienteId: doc.clienteId.toString(),
    orcamentoId: doc.orcamentoId.toString(),
    descricao: doc.descricao,
    status: doc.status as EStatus,
    historico: ((doc.historico ?? []) as EventoDocument[]).map(toEvento),
    historicoVersao: doc.historicoVersao,
  };
}

export function toEventoPersistence(evento: EventoInput) {
  return {
    status: evento.status,
    data: evento.data,
    motivo: evento.motivo,
    notificacao: evento.notificacao,
  };
}

export function toOrdemServicoCreatePersistence(data: OrdemServicoCriacao) {
  return {
    veiculoId: data.veiculoId,
    clienteId: data.clienteId,
    orcamentoId: data.orcamentoId,
    descricao: data.descricao,
    status: data.status,
    historico: data.historico.map(toEventoPersistence),
    historicoVersao: data.historicoVersao,
  };
}

export function toOrdemServicoUpdatePersistence(data: OrdemServicoAtualizacao) {
  return {
    veiculoId: data.veiculoId,
    clienteId: data.clienteId,
    orcamentoId: data.orcamentoId,
    descricao: data.descricao,
  };
}
