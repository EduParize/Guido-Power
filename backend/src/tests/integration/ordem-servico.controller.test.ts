import express from "express";
import request from "supertest";
import { createOrdemServicoRouter } from "../../application/controllers/ordem-servico.controller";
import { errorHandler } from "../../application/middleware/error-handler.middleware";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";
import { EDecisao } from "../../domain/orcamento/entity/e-decisao";
import {
  FakeOrcamentoRepository,
  FakeOrdemServicoRepository,
  ORCAMENTO_ID,
  orcamentoAprovadoSeed,
  orcamentoGravacao,
  ordemInput,
  ordemUpdateInput,
} from "../mocks/ordem-servico.fakes";

const VEICULO = "64a000000000000000000010";
const CLIENTE = "64a000000000000000000020";

async function makeApp(orcamentoOverrides: Parameters<typeof orcamentoAprovadoSeed>[1] = {}) {
  const repo = new FakeOrdemServicoRepository();
  const orcamentoRepo = new FakeOrcamentoRepository();
  orcamentoRepo.items.push(orcamentoAprovadoSeed(ORCAMENTO_ID, orcamentoOverrides));
  const whatsapp = { enviar: jest.fn().mockResolvedValue(undefined) };
  const service = new OrdemServicoService(
    repo,
    repo,
    { findById: async (id: string) => (id === VEICULO ? { id, dono: CLIENTE, marca: "Fiat", modelo: "Uno", placa: "ABC1D23" } : null) } as any,
    { findById: async (id: string) => (id === CLIENTE ? { id, nome: "Ana", telefone: "54999999999" } : null) } as any,
    whatsapp,
    orcamentoRepo,
  );
  const app = express();
  app.use(express.json());
  app.use("/api/ordens-servico", createOrdemServicoRouter(service));
  app.use(errorHandler);
  return { app, whatsapp, orcamentoRepo };
}

describe("/api/ordens-servico", () => {
  it("CRUD sem envio de WhatsApp", async () => {
    const { app, whatsapp } = await makeApp();
    const created = await request(app).post("/api/ordens-servico").send(ordemInput(EStatus.EM_ESPERA));
    expect(created.status).toBe(201);
    expect(created.body.status).toBe(EStatus.EM_ESPERA);
    expect(created.body.orcamentoId).toBe(ORCAMENTO_ID);
    expect(created.body.historico).toHaveLength(1);
    expect(created.body.historicoVersao).toBeUndefined();
    expect(created.body.decisao).toBeUndefined();
    const id = created.body.id;

    expect((await request(app).get("/api/ordens-servico")).body).toHaveLength(1);
    expect((await request(app).get(`/api/ordens-servico/${id}`)).status).toBe(200);

    const upd = await request(app).put(`/api/ordens-servico/${id}`).send({ ...ordemUpdateInput(), descricao: "Troca de óleo" });
    expect(upd.status).toBe(200);
    expect(upd.body.descricao).toBe("Troca de óleo");
    expect(upd.body.status).toBe(EStatus.EM_ESPERA);
    expect(upd.body.historico).toHaveLength(1);
    expect(whatsapp.enviar).not.toHaveBeenCalled();

    expect((await request(app).delete(`/api/ordens-servico/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/ordens-servico/${id}`)).status).toBe(404);
  });

  it("400 com status inválido ou ausente no create", async () => {
    const { app } = await makeApp();
    expect((await request(app).post("/api/ordens-servico").send({ ...ordemInput(), status: "ABERTO" })).status).toBe(400);
    expect((await request(app).post("/api/ordens-servico").send(ordemUpdateInput())).status).toBe(400);
  });

  it("400 quando o PUT tenta mudar o status", async () => {
    const { app } = await makeApp();
    const id = (await request(app).post("/api/ordens-servico").send(ordemInput())).body.id;
    const res = await request(app).put(`/api/ordens-servico/${id}`).send(ordemInput(EStatus.FINALIZADO));
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("só podem ser alterados pelos eventos");
  });

  it("404 para orçamento inexistente", async () => {
    const { app } = await makeApp();
    const res = await request(app).post("/api/ordens-servico").send({
      ...ordemInput(),
      orcamentoId: "64f000000000000000000099",
    });
    expect(res.status).toBe(404);
  });

  it("409 quando orçamento não está aprovado", async () => {
    const { app } = await makeApp({ decisao: EDecisao.PENDENTE });
    const res = await request(app).post("/api/ordens-servico").send(ordemInput());
    expect(res.status).toBe(409);
  });

  it("409 quando o orçamento já está em outra ordem", async () => {
    const { app, orcamentoRepo } = await makeApp();
    await request(app).post("/api/ordens-servico").send(ordemInput());
    const segundo = await orcamentoRepo.create(orcamentoGravacao({
      decisao: EDecisao.APROVADO,
      valorCentavos: 1000,
      itens: [],
    }));
    const conflito = await request(app).post("/api/ordens-servico").send(ordemInput());
    expect(conflito.status).toBe(409);

    const ok = await request(app).post("/api/ordens-servico").send(ordemInput(EStatus.EM_ESPERA, segundo.id));
    expect(ok.status).toBe(201);
  });

  it("exige motivo no status inicial pausado ou cancelado", async () => {
    const { app } = await makeApp();
    const semMotivo = { ...ordemInput(), status: EStatus.PAUSADO };
    const invalida = await request(app).post("/api/ordens-servico").send(semMotivo);
    expect(invalida.status).toBe(400);

    const valida = await request(app)
      .post("/api/ordens-servico")
      .send({ ...semMotivo, motivo: "Aguardando cliente" });
    expect(valida.status).toBe(201);
    expect(valida.body.historico[0].motivo).toBe("Aguardando cliente");
  });
});
