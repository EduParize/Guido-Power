import { Cliente } from "../../../../domain/cliente/entity/cliente.entity";
import { ClienteDocument } from "../../../db/mongo/schema/cliente.schema";

export function toCliente(doc: ClienteDocument): Cliente {
  return {
    id: doc._id.toString(),
    nome: doc.nome,
    documento: doc.documento,
    email: doc.email,
    // Clientes antigos podem não ter telefone gravado.
    telefone: doc.telefone ?? "",
  };
}
