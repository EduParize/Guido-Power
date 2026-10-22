import { Cliente, ClienteInput } from "../entity/cliente.entity";

export interface ClienteRepositoryWrite {
  create(data: ClienteInput): Promise<Cliente>;
  update(id: string, data: ClienteInput): Promise<Cliente | null>;
  delete(id: string): Promise<boolean>;
}
