import { OrcamentoService } from "../../domain/orcamento/service/orcamento.service";
import { OrcamentoRepositoryReadMongo } from "../../infraestructure/repository/orcamento/orcamento.repository.read";
import { OrcamentoRepositoryWriteMongo } from "../../infraestructure/repository/orcamento/orcamento.repository.write";

export function makeOrcamentoService(): OrcamentoService {
  return new OrcamentoService(
    new OrcamentoRepositoryReadMongo(),
    new OrcamentoRepositoryWriteMongo(),
  );
}