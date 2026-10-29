import { loadEnv } from "../env-constants/env";
import { OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";
import { ClienteRepositoryReadMongo } from "../../infraestructure/repository/cliente/cliente.repository.read";
import { OrdemServicoRepositoryReadMongo } from "../../infraestructure/repository/ordem-servico/ordem-servico.repository.read";
import { OrdemServicoRepositoryWriteMongo } from "../../infraestructure/repository/ordem-servico/ordem-servico.repository.write";
import { OrcamentoRepositoryReadMongo } from "../../infraestructure/repository/orcamento/orcamento.repository.read";
import { VeiculoRepositoryReadMongo } from "../../infraestructure/repository/veiculo/veiculo.repository.read";
import { ZenviaExternalService } from "../../infraestructure/external-service/zenvia/zenvia.external-service";

export function makeOrdemServicoService(): OrdemServicoService {
  const env = loadEnv();
  return new OrdemServicoService(
    new OrdemServicoRepositoryReadMongo(),
    new OrdemServicoRepositoryWriteMongo(),
    new VeiculoRepositoryReadMongo(),
    new ClienteRepositoryReadMongo(),
    new ZenviaExternalService({
      apiUrl: env.ZENVIA_API_URL,
      token: env.ZENVIA_API_TOKEN,
      from: env.ZENVIA_WHATSAPP_FROM,
    }),
    new OrcamentoRepositoryReadMongo(),
  );
}
