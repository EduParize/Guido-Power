import express from "express";
import request from "supertest";
import { createOrcamentoRouter } from "../../application/controllers/orcamento.controller";
import { createOrdemServicoRouter } from "../../application/controllers/ordem-servico.controller";
import { errorHandler } from "../../application/middleware/error-handler.middleware";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";
import { ETipo } from "../../domain/orcamento/entity/e-tipo";
import { OrcamentoService } from "../../domain/orcamento/service/orcamento.service";
import {
  FakeOrcamentoRepository,
  FakeOrdemServicoRepository,
} from "../mocks/ordem-servico.fakes";

const VEICULO = "64a000000000000000000010";
const CLIENTE = "64a000000000000000000020";

const orcamentoBody = {
  itens: [{
    descricao: "Pastilha",
    tipo: ETipo.PECA,
    quantidade: 2,
    valorUnitario: 80.25,
  }],
};

function makeApp() {
  const ordemRepo = new FakeOrdemServicoRepository();
  const orcamentoRepo = new FakeOrcamentoRepository();
  const whatsapp = { enviar: jest.fn().mockResolvedValue(undefined) };
  const ordemService = new OrdemServicoService(
    ordemRepo,
    ordemRepo,
    { findById: async (id: string) => (id === VEICULO ? { id, dono: CLIENTE, marca: "Fiat", modelo: "Uno", placa: "ABC1D23" } : null) } as any,
    { findById: async (id: string) => (id === CLIENTE ? { id, nome: "Ana", telefone: "54999999999" } : null) } as any,
    whatsapp,
    orcamentoRepo,
  );
  const orcamentoService = new OrcamentoService(orcamentoRepo, orcamentoRepo, ordemRepo);
  const app = express();
  app.use(express.json());
  app.use("/api/orcamentos", createOrcamentoRouter(orcamentoService));
  app.use("/api/ordens-servico", createOrdemServicoRouter(ordemService));
  app.use(errorHandler);
  return { app, orcamentoRepo };
}

describe("/api/orcamentos", () => {
  it("CRUD completo sem lead; total derivado dos itens", async () => {
    const { app } = makeApp();
    const criado = await request(app).post("/api/orcamentos").send(orcamentoBody);
    expect(criado.status).toBe(201);
    expect(criado.body.valor).toBe(160.5);
    expect(criado.body.itens[0].valorUnitario).toBe(80.25);
    expect(criado.body.nome).toBeNull();
    expect(criado.body.telefone).toBeNull();
    expect(criado.body.placa).toBeNull();
    expect(criado.body.decisao).toBe("PENDENTE");
    expect(criado.body.decisaoData).toBeDefined();
    expect(criado.body.ordemServicoId).toBeUndefined();
    const id = criado.body.id;

    expect((await request(app).get("/api/orcamentos")).body).toHaveLength(1);
    expect((await request(app).get(`/api/orcamentos/${id}`)).status).toBe(200);

    const atualizado = await request(app).put(`/api/orcamentos/${id}`).send({ itens: [] });
    expect(atualizado.status).toBe(200);
    expect(atualizado.body.valor).toBe(0);

    expect((await request(app).delete(`/api/orcamentos/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/orcamentos/${id}`)).status).toBe(404);
  });

  it("cria com lead e aprova via PUT", async () => {
    const { app } = makeApp();
    const criado = await request(app).post("/api/orcamentos").send({
      ...orcamentoBody,
      nome: "João",
      telefone: "54999998888",
      placa: "abc1d23",
    });
    expect(criado.status).toBe(201);
    expect(criado.body).toMatchObject({
      nome: "João",
      telefone: "54999998888",
      placa: "ABC1D23",
      decisao: "PENDENTE",
      valor: 160.5,
    });

    const aprovado = await request(app).put(`/api/orcamentos/${criado.body.id}`).send({
      ...orcamentoBody,
      nome: "João",
      telefone: "54999998888",
      placa: "ABC1D23",
      decisao: "APROVADO",
    });
    expect(aprovado.status).toBe(200);
    expect(aprovado.body.decisao).toBe("APROVADO");
  });

  it("create ignora decisao no body e nasce PENDENTE", async () => {
    const { app } = makeApp();
    const criado = await request(app).post("/api/orcamentos").send({
      ...orcamentoBody,
      decisao: "APROVADO",
    });
    expect(criado.status).toBe(201);
    expect(criado.body.decisao).toBe("PENDENTE");
  });

  it("400 para quantidade inválida, unitário negativo ou telefone inválido", async () => {
    const { app } = makeApp();
    expect((await request(app).post("/api/orcamentos").send({
      itens: [{ ...orcamentoBody.itens[0], quantidade: 0 }],
    })).status).toBe(400);
    expect((await request(app).post("/api/orcamentos").send({
      itens: [{ ...orcamentoBody.itens[0], valorUnitario: -1 }],
    })).status).toBe(400);
    const casas = await request(app).post("/api/orcamentos").send({
      itens: [{ ...orcamentoBody.itens[0], valorUnitario: 10.999 }],
    });
    expect(casas.status).toBe(400);
    expect(casas.body.error).toContain("no máximo duas casas decimais");
    expect((await request(app).post("/api/orcamentos").send({ ...orcamentoBody, telefone: "123" })).status).toBe(400);
  });

  it("409 ao apagar orçamento em uso; lead permanece após criar OS", async () => {
    const { app, orcamentoRepo } = makeApp();
    const orcamentoId = (await request(app).post("/api/orcamentos").send({
      ...orcamentoBody,
      nome: "Ana",
      telefone: "54999999999",
    })).body.id;

    const aprovado = await request(app).put(`/api/orcamentos/${orcamentoId}`).send({
      ...orcamentoBody,
      nome: "Ana",
      telefone: "54999999999",
      decisao: "APROVADO",
    });
    expect(aprovado.status).toBe(200);
    expect(aprovado.body.decisao).toBe("APROVADO");

    const ordem = await request(app).post("/api/ordens-servico").send({
      veiculoId: VEICULO,
      clienteId: CLIENTE,
      orcamentoId,
      descricao: "Revisão",
      status: EStatus.EM_ESPERA,
    });
    expect(ordem.status).toBe(201);

    const orcamento = await orcamentoRepo.findById(orcamentoId);
    expect(orcamento).toMatchObject({ nome: "Ana", telefone: "54999999999" });

    expect((await request(app).delete(`/api/orcamentos/${orcamentoId}`)).status).toBe(409);

    expect((await request(app).delete(`/api/ordens-servico/${ordem.body.id}`)).status).toBe(204);
    expect(await orcamentoRepo.findById(orcamentoId)).not.toBeNull();
    expect((await request(app).delete(`/api/orcamentos/${orcamentoId}`)).status).toBe(204);
  });
});
