import { Orcamento } from "../../../../domain/orcamento/entity/orcamento.entity";
import { OrcamentoDocument } from "../../../db/mongo/schema/orcamento.schema";

export function toOrcamento(doc: OrcamentoDocument): Orcamento {
  return { id: doc._id.toString(), valorCentavos: doc.valorCentavos };
}