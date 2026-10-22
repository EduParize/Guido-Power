import { Types } from "mongoose";
import { EDecisao } from "../../../../domain/ordem-servico/entity/e-decisao";
import { EStatus } from "../../../../domain/ordem-servico/entity/e-status";
import { ETipo } from "../../../../domain/ordem-servico/entity/e-tipo";
import { Evento } from "../../../../domain/ordem-servico/entity/evento.entity";
import { ItemOrdem, OrdemServico } from "../../../../domain/ordem-servico/entity/ordem-servico.entity";
import { OrdemServicoDocument } from "../../../db/mongo/schema/ordem-servico.schema";

function toItem(item: { descricao: string; tipo: string; quantidade: number; valorUnitario: number }): ItemOrdem {
  return {
    descricao: item.descricao,
    tipo: item.tipo as ETipo,
    quantidade: item.quantidade,
    valorUnitario: item.valorUnitario,
  };
}

export type EventoDocument = { _id: Types.ObjectId; data: Date; status: string };

export function toEvento(evento: EventoDocument): Evento {
  return {
    id: evento._id.toString(),
    status: evento.status as EStatus,
    data: evento.data,
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
    orcamento: doc.orcamento,
    status: doc.status as EStatus,
    historico: ((doc.historico ?? []) as EventoDocument[]).map(toEvento),
    itens: (doc.itens ?? []).map(toItem),
  };
}
