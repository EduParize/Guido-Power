
import { Usuario } from "../../../../domain/usuario/entity/usuario.entity";

export function usuarioDocumentToEntity(document: any): Usuario {
  return {
    id: document._id.toString(),
    nome: document.nome,
    email: document.email,
    senhaHash: document.senhaHash,
  };
}
