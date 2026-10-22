import { EDecisao } from "../../../../domain/ordem-servico/entity/e-decisao";
import { EStatus } from "../../../../domain/ordem-servico/entity/e-status";
import { ETipo } from "../../../../domain/ordem-servico/entity/e-tipo";
import { EventoOrdem, ItemOrdem, OrdemServico } from "../../../../domain/ordem-servico/entity/ordem-servico.entity";
import { OrdemServicoDocument } from "../../../db/mongo/schema/ordem-servico.schema";

function toItem(item: { descricao: string; tipo: string; quantidade: number; valorUnitario: number }): ItemOrdem {
  return {
    descricao: item.descricao,
    tipo: item.tipo as ETipo,
    quantidade: item.quantidade,
    valorUnitario: item.valorUnitario,
  };
}

function toEvento(evento: { data: Date; status: string; motivo?: string | null }): EventoOrdem {
  return {
    data: evento.data,
    status: evento.status as EStatus,
    motivo: evento.motivo ?? null,
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
    historico: (doc.historico ?? []).map(toEvento),
    itens: (doc.itens ?? []).map(toItem),
  };
}
