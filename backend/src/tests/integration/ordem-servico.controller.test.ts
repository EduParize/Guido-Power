import express from "express";
import request from "supertest";
import { createOrdemServicoRouter } from "../../application/controllers/ordem-servico.controller";
import { errorHandler } from "../../application/middleware/error-handler.middleware";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { TemplateWhatsapp } from "../../domain/ordem-servico/entity/template-whatsapp";
import { OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";
import { FakeOrdemServicoRepository, ordemInput } from "../mocks/ordem-servico.fakes";

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
  it("CRUD e envio só quando o status muda", async () => {
    const { app, whatsapp } = makeApp();
    const created = await request(app).post("/api/ordens-servico").send(ordemInput());
    expect(created.status).toBe(201);
    expect(whatsapp.enviar).not.toHaveBeenCalled();
    const id = created.body.id;

    expect((await request(app).get("/api/ordens-servico")).body).toHaveLength(1);
    expect((await request(app).get(`/api/ordens-servico/${id}`)).status).toBe(200);

    const upd = await request(app).put(`/api/ordens-servico/${id}`).send(ordemInput(EStatus.FINALIZADO));
    expect(upd.status).toBe(200);
    expect(upd.body.status).toBe(EStatus.FINALIZADO);
    expect(upd.body.historico).toHaveLength(1);
    expect(whatsapp.enviar).toHaveBeenCalledWith(expect.objectContaining({
      para: "54999999999",
      template: TemplateWhatsapp.ServicoFinalizado,
      campos: expect.objectContaining({
        nomeCliente: "Ana",
        veiculo: "Fiat Uno ABC1D23",
        status: EStatus.FINALIZADO,
      }),
    }));

    expect((await request(app).delete(`/api/ordens-servico/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/ordens-servico/${id}`)).status).toBe(404);
  });

  it("400 com status inválido", async () => {
    const { app } = makeApp();
    const res = await request(app).post("/api/ordens-servico").send({ ...ordemInput(), status: "ABERTO" });
    expect(res.status).toBe(400);
  });
});
