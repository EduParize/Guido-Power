import { Cliente } from "../entity/cliente.entity";

export interface ClienteRepositoryRead {
  findById(id: string): Promise<Cliente | null>;
  list(): Promise<Cliente[]>;
  findByEmail(email: string): Promise<Cliente | null>;
  findByDocumento(documento: string): Promise<Cliente | null>;
}
