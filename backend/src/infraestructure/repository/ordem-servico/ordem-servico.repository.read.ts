import { isValidObjectId } from "mongoose";
import { OrdemServico } from "../../../domain/ordem-servico/entity/ordem-servico.entity";
import { OrdemServicoRepositoryRead } from "../../../domain/ordem-servico/repository/ordem-servico.repository.read";
import { OrdemServicoModel } from "../../db/mongo/models/ordem-servico.model";
import { toOrdemServico } from "./adapters/ordem-servico.adapter";

export class OrdemServicoRepositoryReadMongo implements OrdemServicoRepositoryRead {
  async findById(id: string): Promise<OrdemServico | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await OrdemServicoModel.findById(id).lean();
    return doc ? toOrdemServico(doc) : null;
  }

  async list(): Promise<OrdemServico[]> {
    return (await OrdemServicoModel.find().lean()).map(toOrdemServico);
  }

  async existsByVeiculoId(veiculoId: string): Promise<boolean> {
    return (await OrdemServicoModel.exists({ veiculoId })) !== null;
  }
}
