import { VeiculoService } from "../../domain/veiculo/service/veiculo.service";
import { ClienteRepositoryReadMongo } from "../../infraestructure/repository/cliente/cliente.repository.read";
import { OrcamentoRepositoryReadMongo } from "../../infraestructure/repository/orcamento/orcamento.repository.read";
import { OrdemServicoRepositoryReadMongo } from "../../infraestructure/repository/ordem-servico/ordem-servico.repository.read";
import { VeiculoRepositoryReadMongo } from "../../infraestructure/repository/veiculo/veiculo.repository.read";
import { VeiculoRepositoryWriteMongo } from "../../infraestructure/repository/veiculo/veiculo.repository.write";

export function makeVeiculoService(): VeiculoService {
  return new VeiculoService(
    new VeiculoRepositoryReadMongo(),
    new VeiculoRepositoryWriteMongo(),
    new ClienteRepositoryReadMongo(),
    new OrdemServicoRepositoryReadMongo(),
    new OrcamentoRepositoryReadMongo(),
  );
}
