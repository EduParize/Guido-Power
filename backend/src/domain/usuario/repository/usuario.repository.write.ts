
import { Usuario } from "../entity/usuario.entity";

export type UsuarioCreateData = Omit<Usuario, "id">;
export type UsuarioUpdateData = Partial<UsuarioCreateData>;

export interface UsuarioRepositoryWrite {
  create(data: UsuarioCreateData): Promise<Usuario>;
  update(id: string, data: UsuarioUpdateData): Promise<Usuario | null>;
  delete(id: string): Promise<boolean>;
}
