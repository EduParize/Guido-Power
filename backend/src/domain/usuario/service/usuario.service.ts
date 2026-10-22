
import { Usuario } from "../entity/usuario.entity";
import {
  UsuarioRepositoryRead,
} from "../repository/usuario.repository.read";
import {
  UsuarioCreateData,
  UsuarioRepositoryWrite,
  UsuarioUpdateData,
} from "../repository/usuario.repository.write";
import {
  AppError,
  NotFoundError,
} from "../../common/errors/app-error";

export class UsuarioService {
  constructor(
    private readonly readRepository: UsuarioRepositoryRead,
    private readonly writeRepository: UsuarioRepositoryWrite,
  ) {}

  async list(): Promise<Usuario[]> {
    return this.readRepository.list();
  }

  async findById(id: string): Promise<Usuario> {
    const usuario = await this.readRepository.findById(id);

    if (!usuario) {
      throw new NotFoundError("Usuário não encontrado");
    }

    return usuario;
  }

  async create(data: UsuarioCreateData): Promise<Usuario> {
    const existente = await this.readRepository.findByEmail(data.email);

    if (existente) {
      throw new AppError("E-mail já cadastrado", 409);
    }

    return this.writeRepository.create(data);
  }

  async update(
    id: string,
    data: UsuarioUpdateData,
  ): Promise<Usuario> {
    // Confirma que o usuário existe.
    await this.findById(id);

    // Verifica duplicidade somente se o e-mail foi informado.
    if (data.email !== undefined) {
      const existente = await this.readRepository.findByEmail(data.email);

      if (existente && existente.id !== id) {
        throw new AppError("E-mail já cadastrado", 409);
      }
    }

    const atualizado = await this.writeRepository.update(id, data);

    if (!atualizado) {
      throw new NotFoundError("Usuário não encontrado");
    }

    return atualizado;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);

    const removido = await this.writeRepository.delete(id);

    if (!removido) {
      throw new NotFoundError("Usuário não encontrado");
    }
  }
}
