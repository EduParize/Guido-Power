import { isValidObjectId } from "mongoose";
import { Cliente } from "../../../domain/cliente/entity/cliente.entity";
import { ClienteRepositoryRead } from "../../../domain/cliente/repository/cliente.repository.read";
import { ClienteModel } from "../../db/mongo/models/cliente.model";
import { toCliente } from "./adapters/cliente.adapter";

export class ClienteRepositoryReadMongo implements ClienteRepositoryRead {
  async findById(id: string): Promise<Cliente | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await ClienteModel.findById(id).lean();
    return doc ? toCliente(doc) : null;
  }

  async list(): Promise<Cliente[]> {
    return (await ClienteModel.find().lean()).map(toCliente);
  }

  async findByEmail(email: string): Promise<Cliente | null> {
    const doc = await ClienteModel.findOne({ email }).lean();
    return doc ? toCliente(doc) : null;
  }

  async findByDocumento(documento: string): Promise<Cliente | null> {
    const doc = await ClienteModel.findOne({ documento }).lean();
    return doc ? toCliente(doc) : null;
  }
}
