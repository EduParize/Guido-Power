import { VeiculoService } from "../../domain/veiculo/service/veiculo.service";
import { VeiculoRepositoryReadMongo } from "../../infraestructure/repository/veiculo/veiculo.repository.read";
import { VeiculoRepositoryWriteMongo } from "../../infraestructure/repository/veiculo/veiculo.repository.write";
import { ClienteRepositoryReadMongo } from "../../infraestructure/repository/cliente/cliente.repository.read";
import { OrdemServicoRepositoryReadMongo } from "../../infraestructure/repository/ordem-servico/ordem-servico.repository.read";

export function makeVeiculoService(): VeiculoService {
  return new VeiculoService(
    new VeiculoRepositoryReadMongo(),
    new VeiculoRepositoryWriteMongo(),
    new ClienteRepositoryReadMongo(),
    new OrdemServicoRepositoryReadMongo(),
  );
}