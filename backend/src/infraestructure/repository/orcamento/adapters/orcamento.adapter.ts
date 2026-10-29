import { EDecisao } from "../../../../domain/orcamento/entity/e-decisao";
import { ETipo } from "../../../../domain/orcamento/entity/e-tipo";
import { ItemOrcamento, Orcamento } from "../../../../domain/orcamento/entity/orcamento.entity";
import { OrcamentoDocument } from "../../../db/mongo/schema/orcamento.schema";

type ItemDocument = {
  descricao: string;
  tipo: string;
  quantidade: number;
  valorUnitarioCentavos: number;
};

function toItem(item: ItemDocument): ItemOrcamento {
  return {
    descricao: item.descricao,
    tipo: item.tipo as ETipo,
    quantidade: item.quantidade,
    valorUnitarioCentavos: item.valorUnitarioCentavos,
  };
}

export function toOrcamento(doc: OrcamentoDocument): Orcamento {
  return {
    id: doc._id.toString(),
    nome: doc.nome ?? null,
    telefone: doc.telefone ?? null,
    placa: doc.placa ?? null,
    decisao: doc.decisao as EDecisao,
    decisaoData: doc.decisaoData,
    valorCentavos: doc.valorCentavos,
    itens: ((doc.itens ?? []) as ItemDocument[]).map(toItem),
  };
}
