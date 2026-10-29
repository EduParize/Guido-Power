import { ClienteService } from "../../domain/cliente/service/cliente.service";
import { ClienteRepositoryReadMongo } from "../../infraestructure/repository/cliente/cliente.repository.read";
import { ClienteRepositoryWriteMongo } from "../../infraestructure/repository/cliente/cliente.repository.write";
import { OrcamentoRepositoryReadMongo } from "../../infraestructure/repository/orcamento/orcamento.repository.read";
import { VeiculoRepositoryReadMongo } from "../../infraestructure/repository/veiculo/veiculo.repository.read";

export function makeClienteService(): ClienteService {
  return new ClienteService(
    new ClienteRepositoryReadMongo(),
    new ClienteRepositoryWriteMongo(),
    new VeiculoRepositoryReadMongo(),
    new OrcamentoRepositoryReadMongo(),
  );
}
