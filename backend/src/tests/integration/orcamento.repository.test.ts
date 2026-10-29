import * as os from "node:os";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { EDecisao } from "../../domain/orcamento/entity/e-decisao";
import { ETipo } from "../../domain/orcamento/entity/e-tipo";
import { OrcamentoGravacao } from "../../domain/orcamento/entity/orcamento.entity";
import { OrcamentoModel } from "../../infraestructure/db/mongo/models/orcamento.model";
import { OrcamentoRepositoryWriteMongo } from "../../infraestructure/repository/orcamento/orcamento.repository.write";
import { OrcamentoRepositoryReadMongo } from "../../infraestructure/repository/orcamento/orcamento.repository.read";

jest.setTimeout(120_000);

const gravacaoBase = (): OrcamentoGravacao => ({
  nome: null,
  telefone: null,
  placa: null,
  decisao: EDecisao.PENDENTE,
  decisaoData: new Date("2024-01-01T12:00:00.000Z"),
  valorCentavos: 16050,
  itens: [{
    descricao: "Pastilha",
    tipo: ETipo.PECA,
    quantidade: 2,
    valorUnitarioCentavos: 8025,
  }],
});

describe("OrcamentoRepositoryMongo", () => {
  let mongo: MongoMemoryServer | undefined;
  let writeRepo: OrcamentoRepositoryWriteMongo;
  let readRepo: OrcamentoRepositoryReadMongo;
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
    writeRepo = new OrcamentoRepositoryWriteMongo();
    readRepo = new OrcamentoRepositoryReadMongo();
  });

  afterEach(async () => {
    if (conectado) await OrcamentoModel.deleteMany({});
  });

  afterAll(async () => {
    if (conectado) await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  it("cria, atualiza, lista e remove orçamento com lead e decisão", async () => {
    const criado = await writeRepo.create({
      ...gravacaoBase(),
      nome: "Lead",
      telefone: "54999999999",
      placa: "ABC1D23",
      decisao: EDecisao.APROVADO,
    });

    const documento = await OrcamentoModel.findById(criado.id).lean();
    expect(criado).toMatchObject({
      valorCentavos: 16050,
      nome: "Lead",
      telefone: "54999999999",
      placa: "ABC1D23",
      decisao: EDecisao.APROVADO,
    });
    expect(criado.itens[0].valorUnitarioCentavos).toBe(8025);
    expect(documento?.valorCentavos).toBe(16050);
    expect(Number.isInteger(documento?.valorCentavos)).toBe(true);
    expect(documento).not.toHaveProperty("ordemServicoId");

    const atualizado = await writeRepo.update(criado.id, {
      ...gravacaoBase(),
      valorCentavos: 20000,
      itens: [],
      decisao: EDecisao.RECUSADO,
    });
    expect(atualizado?.valorCentavos).toBe(20000);
    expect(atualizado?.decisao).toBe(EDecisao.RECUSADO);

    expect(await readRepo.findById(criado.id)).toMatchObject({
      valorCentavos: 20000,
      decisao: EDecisao.RECUSADO,
    });
    expect(await readRepo.list()).toHaveLength(1);

    expect(await writeRepo.delete(criado.id)).toBe(true);
    expect(await readRepo.findById(criado.id)).toBeNull();
  });
});
