import { OrdemServico, OrdemServicoAtualizacao, OrdemServicoCriacao } from "../../../domain/ordem-servico/entity/ordem-servico.entity";
import { OrdemServicoRepositoryWrite } from "../../../domain/ordem-servico/repository/ordem-servico.repository.write";
import { OrdemServicoModel } from "../../db/mongo/models/ordem-servico.model";
import { toOrdemServico } from "./adapters/ordem-servico.adapter";

export class OrdemServicoRepositoryWriteMongo implements OrdemServicoRepositoryWrite {
  async create(data: OrdemServicoCriacao): Promise<OrdemServico> {
    const doc = await OrdemServicoModel.create(data);
    return toOrdemServico(doc.toObject());
  }

  async update(id: string, data: OrdemServicoAtualizacao): Promise<OrdemServico | null> {
    // $set só com os campos editáveis: status e historico ficam como estão.
    const doc = await OrdemServicoModel.findByIdAndUpdate(id, { $set: data }, {
      new: true,
      runValidators: true,
    }).lean();
    return doc ? toOrdemServico(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    return (await OrdemServicoModel.findByIdAndDelete(id)) !== null;
  }
}
