import { AppError } from "../../../domain/common/errors/app-error";
import { Cliente, ClienteInput } from "../../../domain/cliente/entity/cliente.entity";
import { ClienteRepositoryWrite } from "../../../domain/cliente/repository/cliente.repository.write";
import { ClienteModel } from "../../db/mongo/models/cliente.model";
import { toCliente } from "./adapters/cliente.adapter";

const traduzErro = (e: unknown): never => {
  if ((e as { code?: number })?.code === 11000) {
    const chave = Object.keys(
      (e as { keyPattern?: Record<string, number> }).keyPattern ?? {},
    )[0];
    if (chave === "documento") {
      throw new AppError("Já existe um cliente com esse documento", 409);
    }
    throw new AppError("Já existe um cliente com esse e-mail", 409);
  }
  throw e;
};

export class ClienteRepositoryWriteMongo implements ClienteRepositoryWrite {
  async create(data: ClienteInput): Promise<Cliente> {
    try {
      const doc = await ClienteModel.create(data);
      return toCliente(doc.toObject());
    } catch (e) {
      return traduzErro(e);
    }
  }

  async update(id: string, data: ClienteInput): Promise<Cliente | null> {
    try {
      const doc = await ClienteModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).lean();
      return doc ? toCliente(doc) : null;
    } catch (e) {
      return traduzErro(e);
    }
  }

  async delete(id: string): Promise<boolean> {
    return (await ClienteModel.findByIdAndDelete(id)) !== null;
  }
}
