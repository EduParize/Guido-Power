
import { UsuarioRepositoryRead } from "../../../domain/usuario/repository/usuario.repository.read";
import { UsuarioModel } from "../../db/mongo/models/usuario.model";
import { usuarioDocumentToEntity } from "./adapters/usuario.adapter";

export class UsuarioRepositoryReadMongo
  implements UsuarioRepositoryRead
{
  async findById(id: string) {
    const document = await UsuarioModel.findById(id);

    return document ? usuarioDocumentToEntity(document) : null;
  }

  async list() {
    const documents = await UsuarioModel.find();

    return documents.map(usuarioDocumentToEntity);
  }

  async findByEmail(email: string) {
    const document = await UsuarioModel.findOne({ email });

    return document ? usuarioDocumentToEntity(document) : null;
  }
}
