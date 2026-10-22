
import {
  UsuarioCreateData,
  UsuarioRepositoryWrite,
  UsuarioUpdateData,
} from "../../../domain/usuario/repository/usuario.repository.write";
import { UsuarioModel } from "../../db/mongo/models/usuario.model";
import { usuarioDocumentToEntity } from "./adapters/usuario.adapter";

export class UsuarioRepositoryWriteMongo
  implements UsuarioRepositoryWrite
{
  async create(data: UsuarioCreateData) {
    const document = await UsuarioModel.create(data);

    return usuarioDocumentToEntity(document);
  }

  async update(id: string, data: UsuarioUpdateData) {
    const document = await UsuarioModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    return document ? usuarioDocumentToEntity(document) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await UsuarioModel.findByIdAndDelete(id);

    return result !== null;
  }
}
