import express from "express";
import request from "supertest";
import { createOrdemServicoRouter } from "../../application/controllers/ordem-servico.controller";
import { errorHandler } from "../../application/middleware/error-handler.middleware";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";
import { FakeOrdemServicoRepository, ordemInput, ordemUpdateInput } from "../mocks/ordem-servico.fakes";

const VEICULO = "64a000000000000000000010";
const CLIENTE = "64a000000000000000000020";

function makeApp() {
  const repo = new FakeOrdemServicoRepository();
  const whatsapp = { enviar: jest.fn().mockResolvedValue(undefined) };
  const service = new OrdemServicoService(
    repo,
    repo,
    { findById: async (id: string) => (id === VEICULO ? { id, dono: CLIENTE, marca: "Fiat", modelo: "Uno", placa: "ABC1D23" } : null) } as any,
    { findById: async (id: string) => (id === CLIENTE ? { id, nome: "Ana", telefone: "54999999999" } : null) } as any,
    whatsapp,
  );
  const app = express();
  app.use(express.json());
  app.use("/api/ordens-servico", createOrdemServicoRouter(service));
  app.use(errorHandler);
  return { app, whatsapp };
}

describe("/api/ordens-servico", () => {
  it("CRUD sem envio de WhatsApp", async () => {
    const { app, whatsapp } = makeApp();
    const created = await request(app).post("/api/ordens-servico").send(ordemInput(EStatus.EM_ESPERA));
    expect(created.status).toBe(201);
    expect(created.body.status).toBe(EStatus.EM_ESPERA);
    expect(created.body.historico).toHaveLength(1);
    expect(created.body.orcamento).toBe(150.5);
    expect(created.body.itens[0].valorUnitario).toBe(80.25);
    expect(created.body.orcamentoCentavos).toBeUndefined();
    expect(created.body.historicoVersao).toBeUndefined();
    const id = created.body.id;

    expect((await request(app).get("/api/ordens-servico")).body).toHaveLength(1);
    expect((await request(app).get(`/api/ordens-servico/${id}`)).status).toBe(200);

    const upd = await request(app).put(`/api/ordens-servico/${id}`).send({ ...ordemUpdateInput(), descricao: "Troca de óleo" });
    expect(upd.status).toBe(200);
    expect(upd.body.descricao).toBe("Troca de óleo");
    expect(upd.body.status).toBe(EStatus.EM_ESPERA);
    expect(upd.body.historico).toHaveLength(1);
    expect(upd.body.orcamento).toBe(150.5);
    expect(upd.body.itens[0].valorUnitario).toBe(80.25);
    expect(whatsapp.enviar).not.toHaveBeenCalled();

    expect((await request(app).delete(`/api/ordens-servico/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/ordens-servico/${id}`)).status).toBe(404);
  });

  it("400 com status inválido ou ausente no create", async () => {
    const { app } = makeApp();
    expect((await request(app).post("/api/ordens-servico").send({ ...ordemInput(), status: "ABERTO" })).status).toBe(400);
    expect((await request(app).post("/api/ordens-servico").send(ordemUpdateInput())).status).toBe(400);
  });

  it("400 quando o PUT tenta mudar o status", async () => {
    const { app } = makeApp();
    const id = (await request(app).post("/api/ordens-servico").send(ordemInput())).body.id;
    const res = await request(app).put(`/api/ordens-servico/${id}`).send(ordemInput(EStatus.FINALIZADO));
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("só podem ser alterados pelos eventos");
  });

  it("400 para valor monetário com mais de duas casas", async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post("/api/ordens-servico")
      .send({ ...ordemInput(), orcamento: 10.999 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("no máximo duas casas decimais");
  });

  it("GET seguido de PUT não multiplica os valores por 100", async () => {
    const { app } = makeApp();
    const created = await request(app).post("/api/ordens-servico").send(ordemInput());
    const lida = await request(app).get(`/api/ordens-servico/${created.body.id}`);
    expect(lida.body.orcamento).toBe(150.5);

    const atualizada = await request(app).put(`/api/ordens-servico/${created.body.id}`).send({
      veiculoId: lida.body.veiculoId,
      clienteId: lida.body.clienteId,
      decisao: lida.body.decisao,
      descricao: lida.body.descricao,
      orcamento: lida.body.orcamento,
      itens: lida.body.itens,
    });
    expect(atualizada.status).toBe(200);
    expect(atualizada.body.orcamento).toBe(150.5);
    expect(atualizada.body.itens[0].valorUnitario).toBe(80.25);
  });

  it("exige motivo no status inicial pausado ou cancelado", async () => {
    const { app } = makeApp();
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
