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
    const { app } = makeApp();
    expect((await request(app).post("/api/ordens-servico").send({ ...ordemInput(), status: "ABERTO" })).status).toBe(400);
    expect((await request(app).post("/api/ordens-servico").send(ordemUpdateInput())).status).toBe(400);
  });

  it("400 quando o PUT tenta mudar o status", async () => {
    const { app } = makeApp();
    const id = (await request(app).post("/api/ordens-servico").send(ordemInput())).body.id;
    const res = await request(app).put(`/api/ordens-servico/${id}`).send(ordemInput(EStatus.FINALIZADO));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Campo 'status' só pode ser alterado pelos eventos da ordem de serviço");
  });
});
