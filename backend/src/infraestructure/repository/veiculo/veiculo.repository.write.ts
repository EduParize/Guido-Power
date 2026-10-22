import { AppError } from "../../../domain/common/errors/app-error";
import { Veiculo, VeiculoInput } from "../../../domain/veiculo/entity/veiculo.entity";
import { VeiculoRepositoryWrite } from "../../../domain/veiculo/repository/veiculo.repository.write";
import { VeiculoModel } from "../../db/mongo/models/veiculo.model";
import { toVeiculo } from "./adapters/veiculo.adapter";

const traduzErro = (e: unknown): never => {
  // E11000 = violação do índice único (corrida entre duas requisições com a mesma placa)
  if ((e as { code?: number })?.code === 11000) {
    throw new AppError("Já existe um veículo com essa placa", 409);
  }
  throw e;
};

export class VeiculoRepositoryWriteMongo implements VeiculoRepositoryWrite {
  async create(data: VeiculoInput): Promise<Veiculo> {
    try {
      const doc = await VeiculoModel.create(data);
      return toVeiculo(doc.toObject());
    } catch (e) {
      return traduzErro(e);
    }
  }

  async update(id: string, data: VeiculoInput): Promise<Veiculo | null> {
    try {
      const doc = await VeiculoModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).lean();
      return doc ? toVeiculo(doc) : null;
    } catch (e) {
      return traduzErro(e);
    }
  }

  async delete(id: string): Promise<boolean> {
    return (await VeiculoModel.findByIdAndDelete(id)) !== null;
  }
}