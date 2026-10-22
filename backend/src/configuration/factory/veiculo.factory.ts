import { VeiculoService } from "../../domain/veiculo/service/veiculo.service";
import { VeiculoRepositoryReadMongo } from "../../infraestructure/repository/veiculo/veiculo.repository.read";
import { VeiculoRepositoryWriteMongo } from "../../infraestructure/repository/veiculo/veiculo.repository.write";
import { ClienteRepositoryReadMongo } from "../../infraestructure/repository/cliente/cliente.repository.read";
import { OrdemServicoRepositoryRead } from "../../domain/ordem-servico/repository/ordem-servico.repository.read";

// Provisório até existir a implementação Mongo de ordem de serviço.
const ordemRepoProvisorio: OrdemServicoRepositoryRead = {
  existsByVeiculoId: async () => false,
};

export function makeVeiculoService(): VeiculoService {
  return new VeiculoService(
    new VeiculoRepositoryReadMongo(),
    new VeiculoRepositoryWriteMongo(),
    new ClienteRepositoryReadMongo(),
    ordemRepoProvisorio,
  );
}