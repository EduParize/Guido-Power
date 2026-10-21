import { isValidObjectId } from "mongoose";
import { Veiculo } from "../../../domain/veiculo/entity/veiculo.entity";
import { VeiculoRepositoryRead } from "../../../domain/veiculo/repository/veiculo.repository.read";
import { VeiculoModel } from "../../db/mongo/models/veiculo.model";
import { toVeiculo } from "./adapters/veiculo.adapter";

export class VeiculoRepositoryReadMongo implements VeiculoRepositoryRead {
  async findById(id: string): Promise<Veiculo | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await VeiculoModel.findById(id).lean();
    return doc ? toVeiculo(doc) : null;
  }

  async findByPlaca(placa: string): Promise<Veiculo | null> {
    const doc = await VeiculoModel.findOne({ placa }).lean();
    return doc ? toVeiculo(doc) : null;
  }

  async list(): Promise<Veiculo[]> {
    return (await VeiculoModel.find().lean()).map(toVeiculo);
  }

  async listByClienteId(clienteId: string): Promise<Veiculo[]> {
    return (await VeiculoModel.find({ dono: clienteId }).lean()).map(toVeiculo);
  }

  async existsByClienteId(clienteId: string): Promise<boolean> {
    return (await VeiculoModel.exists({ dono: clienteId })) !== null;
  }
}