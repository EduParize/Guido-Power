import * as os from "node:os";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import {
  EResultadoEnvio,
  EStatusNotificacao,
  EventoInput,
  NotificacaoEvento,
} from "../../domain/ordem-servico/entity/evento.entity";
import { OrdemServicoCriacao } from "../../domain/ordem-servico/entity/ordem-servico.entity";
import { OrdemServicoModel } from "../../infraestructure/db/mongo/models/ordem-servico.model";
import { OrdemServicoRepositoryWriteMongo } from "../../infraestructure/repository/ordem-servico/ordem-servico.repository.write";

jest.setTimeout(120_000);

function notificacao(status: EStatusNotificacao, tentativaId: string | null): NotificacaoEvento {
  return {
    status,
    tentativaId,
    ultimaTentativaEm: tentativaId ? new Date() : null,
    resultadoEnvio: null,
  };
}

function ordemCriacao(): OrdemServicoCriacao {
  return {
    veiculoId: new Types.ObjectId().toString(),
    clienteId: new Types.ObjectId().toString(),
    orcamentoId: new Types.ObjectId().toString(),
    descricao: "Revisão",
    status: EStatus.EM_ESPERA,
    historico: [{
      status: EStatus.EM_ESPERA,
      data: new Date(),
      motivo: null,
      notificacao: notificacao(EStatusNotificacao.NAO_APLICAVEL, null),
    }],
    historicoVersao: 0,
  };
}

function eventoPendente(status: EStatus, tentativaId: string): EventoInput {
  return {
    status,
    data: new Date(),
    motivo: null,
    notificacao: notificacao(EStatusNotificacao.PENDENTE, tentativaId),
  };
}

describe("OrdemServicoRepositoryWriteMongo", () => {
  let mongo: MongoMemoryServer | undefined;
  let repository: OrdemServicoRepositoryWriteMongo;
  let conectado = false;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({
      binary: {
        version: "7.0.14",
        downloadDir: "/tmp/guido-power-mongodb-binaries",
      },
    });
    await mongoose.connect(mongo.getUri(), { runtimeAdapters: { os } });
    conectado = true;
    repository = new OrdemServicoRepositoryWriteMongo();
  });

  afterEach(async () => {
    if (conectado) await OrdemServicoModel.deleteMany({});
  });

  afterAll(async () => {
    if (conectado) await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  it("persiste a ordem com orcamentoId", async () => {
    const criacao = ordemCriacao();
    const ordem = await repository.create(criacao);
    const documento = await OrdemServicoModel.findById(ordem.id).lean();

    expect(ordem.descricao).toBe("Revisão");
    expect(ordem.orcamentoId).toBe(criacao.orcamentoId);
    expect(documento?.orcamentoId.toString()).toBe(criacao.orcamentoId);
    expect(documento).not.toHaveProperty("orcamento");
    expect(documento).not.toHaveProperty("itens");
  });

  it("permite apenas uma mutação concorrente para a mesma versão", async () => {
    const ordem = await repository.create(ordemCriacao());
    const resultados = await Promise.all([
      repository.addEvento(
        ordem.id,
        eventoPendente(EStatus.DIAGNOSTICO, "tentativa-a"),
        ordem.historicoVersao,
      ),
      repository.addEvento(
        ordem.id,
        eventoPendente(EStatus.EM_SERVICO, "tentativa-b"),
        ordem.historicoVersao,
      ),
    ]);

    expect(resultados.filter((resultado) => resultado.tipo === "sucesso")).toHaveLength(1);
    expect(resultados.filter((resultado) => resultado.tipo === "conflito")).toHaveLength(1);

    const persistida = await OrdemServicoModel.findById(ordem.id).lean();
    expect(persistida?.historico).toHaveLength(2);
    expect(persistida?.historicoVersao).toBe(1);
    expect(persistida?.status).toBe(persistida?.historico[1].status);
  });

  it("faz claim atômico e finaliza somente a tentativa identificada", async () => {
    const ordem = await repository.create(ordemCriacao());
    const adicao = await repository.addEvento(
      ordem.id,
      eventoPendente(EStatus.DIAGNOSTICO, "tentativa-inicial"),
      ordem.historicoVersao,
    );
    if (adicao.tipo !== "sucesso") throw new Error("Falha ao preparar evento");

    const falha = await repository.finalizarNotificacao(
      ordem.id,
      adicao.valor.evento.id,
      "tentativa-inicial",
      EStatusNotificacao.FALHA,
      EResultadoEnvio.INCERTO,
    );
    if (falha.tipo !== "sucesso") throw new Error("Falha ao preparar notificação");

    const novaNotificacao = notificacao(EStatusNotificacao.PENDENTE, "tentativa-reenvio");
    const claims = await Promise.all([
      repository.claimNotificacao(
        ordem.id,
        adicao.valor.evento.id,
        falha.valor.ordem.historicoVersao,
        novaNotificacao,
        new Date(),
      ),
      repository.claimNotificacao(
        ordem.id,
        adicao.valor.evento.id,
        falha.valor.ordem.historicoVersao,
        novaNotificacao,
        new Date(),
      ),
    ]);
    expect(claims.filter((resultado) => resultado.tipo === "sucesso")).toHaveLength(1);
    expect(claims.filter((resultado) => resultado.tipo === "conflito")).toHaveLength(1);

    const finalizacaoInvalida = await repository.finalizarNotificacao(
      ordem.id,
      adicao.valor.evento.id,
      "outra-tentativa",
      EStatusNotificacao.ENVIADA,
      null,
    );
    expect(finalizacaoInvalida.tipo).toBe("conflito");
  });

  it("impede adicionar evento com o status atual", async () => {
    const ordem = await repository.create(ordemCriacao());
    const resultado = await repository.addEvento(
      ordem.id,
      eventoPendente(EStatus.EM_ESPERA, "tentativa-duplicada"),
      ordem.historicoVersao,
    );
    expect(resultado.tipo).toBe("conflito");
    expect((await OrdemServicoModel.findById(ordem.id).lean())?.historico).toHaveLength(1);
  });

  it("impede excluir o único evento", async () => {
    const ordem = await repository.create(ordemCriacao());
    const eventoId = ordem.historico[0].id;

    const resultado = await repository.removeEvento(
      ordem.id,
      eventoId,
      ordem.historicoVersao,
    );

    expect(resultado.tipo).toBe("conflito");
    expect((await OrdemServicoModel.findById(ordem.id).lean())?.historico).toHaveLength(1);
  });
});
