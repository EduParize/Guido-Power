import { isValidObjectId } from "mongoose";
import { Orcamento } from "../../../domain/orcamento/entity/orcamento.entity";
import { OrcamentoRepositoryRead } from "../../../domain/orcamento/repository/orcamento.repository.read";
import { OrcamentoModel } from "../../db/mongo/models/orcamento.model";
import { toOrcamento } from "./adapters/orcamento.adapter";

export class OrcamentoRepositoryReadMongo implements OrcamentoRepositoryRead {
  async findById(id: string): Promise<Orcamento | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await OrcamentoModel.findById(id).lean();
    return doc ? toOrcamento(doc) : null;
  }

  async list(): Promise<Orcamento[]> {
    return (await OrcamentoModel.find().lean()).map(toOrcamento);
  }
}
