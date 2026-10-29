import { isValidObjectId } from "mongoose";
import { Orcamento, OrcamentoGravacao } from "../../../domain/orcamento/entity/orcamento.entity";
import { OrcamentoRepositoryWrite } from "../../../domain/orcamento/repository/orcamento.repository.write";
import { OrcamentoModel } from "../../db/mongo/models/orcamento.model";
import { toOrcamento } from "./adapters/orcamento.adapter";

export class OrcamentoRepositoryWriteMongo implements OrcamentoRepositoryWrite {
  async create(data: OrcamentoGravacao): Promise<Orcamento> {
    const doc = await OrcamentoModel.create(data);
    return toOrcamento(doc.toObject());
  }

  async update(id: string, data: OrcamentoGravacao): Promise<Orcamento | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await OrcamentoModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    return doc ? toOrcamento(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    return (await OrcamentoModel.findByIdAndDelete(id)) !== null;
  }
}
