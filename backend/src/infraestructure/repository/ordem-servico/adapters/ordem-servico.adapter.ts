import { Types } from "mongoose";
import { EDecisao } from "../../../../domain/ordem-servico/entity/e-decisao";
import { EStatus } from "../../../../domain/ordem-servico/entity/e-status";
import { ETipo } from "../../../../domain/ordem-servico/entity/e-tipo";
import {
  EResultadoEnvio,
  EStatusNotificacao,
  Evento,
  EventoInput,
} from "../../../../domain/ordem-servico/entity/evento.entity";
import {
  ItemOrdem,
  OrdemServico,
  OrdemServicoAtualizacao,
  OrdemServicoCriacao,
} from "../../../../domain/ordem-servico/entity/ordem-servico.entity";
import { OrdemServicoDocument } from "../../../db/mongo/schema/ordem-servico.schema";

type ItemDocument = {
  descricao: string;
  tipo: string;
  quantidade: number;
  valorUnitario: number;
};

function toItem(item: ItemDocument): ItemOrdem {
  return {
    descricao: item.descricao,
    tipo: item.tipo as ETipo,
    quantidade: item.quantidade,
    valorUnitarioCentavos: item.valorUnitario,
  };
}

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
    decisao: doc.decisao as EDecisao,
    decisaoData: doc.decisaoData,
    descricao: doc.descricao,
    orcamentoCentavos: doc.orcamento,
    status: doc.status as EStatus,
    historico: ((doc.historico ?? []) as EventoDocument[]).map(toEvento),
    historicoVersao: doc.historicoVersao,
    itens: (doc.itens ?? []).map(toItem),
  };
}

function toItemPersistence(item: ItemOrdem) {
  return {
    descricao: item.descricao,
    tipo: item.tipo,
    quantidade: item.quantidade,
    valorUnitario: item.valorUnitarioCentavos,
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
    decisao: data.decisao,
    decisaoData: data.decisaoData,
    descricao: data.descricao,
    orcamento: data.orcamentoCentavos,
    status: data.status,
    historico: data.historico.map(toEventoPersistence),
    historicoVersao: data.historicoVersao,
    itens: data.itens.map(toItemPersistence),
  };
}

export function toOrdemServicoUpdatePersistence(data: OrdemServicoAtualizacao) {
  return {
    veiculoId: data.veiculoId,
    clienteId: data.clienteId,
    decisao: data.decisao,
    decisaoData: data.decisaoData,
    descricao: data.descricao,
    orcamento: data.orcamentoCentavos,
    itens: data.itens.map(toItemPersistence),
  };
}
