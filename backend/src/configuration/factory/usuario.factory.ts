
import { UsuarioService } from "../../domain/usuario/service/usuario.service";
import { UsuarioRepositoryReadMongo } from "../../infraestructure/repository/usuario/usuario.repository.read";
import { UsuarioRepositoryWriteMongo } from "../../infraestructure/repository/usuario/usuario.repository.write";

export function createUsuarioService(): UsuarioService {
  const readRepository = new UsuarioRepositoryReadMongo();
  const writeRepository = new UsuarioRepositoryWriteMongo();

  return new UsuarioService(readRepository, writeRepository);
}
