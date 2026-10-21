
import { Usuario } from "../entity/usuario.entity";

export interface UsuarioRepositoryRead {
  findById(id: string): Promise<Usuario | null>;
  list(): Promise<Usuario[]>;
  findByEmail(email: string): Promise<Usuario | null>;
}
