import { OrdemServico, OrdemServicoGravacao } from "../../../domain/ordem-servico/entity/ordem-servico.entity";
import { OrdemServicoRepositoryWrite } from "../../../domain/ordem-servico/repository/ordem-servico.repository.write";
import { OrdemServicoModel } from "../../db/mongo/models/ordem-servico.model";
import { toOrdemServico } from "./adapters/ordem-servico.adapter";

export class OrdemServicoRepositoryWriteMongo implements OrdemServicoRepositoryWrite {
  async create(data: OrdemServicoGravacao): Promise<OrdemServico> {
    const doc = await OrdemServicoModel.create(data);
    return toOrdemServico(doc.toObject());
  }

  async update(id: string, data: OrdemServicoGravacao): Promise<OrdemServico | null> {
    const doc = await OrdemServicoModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    return doc ? toOrdemServico(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    return (await OrdemServicoModel.findByIdAndDelete(id)) !== null;
  }
}
