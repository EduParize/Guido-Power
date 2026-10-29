import express from "express";
import request from "supertest";
import { createEventoRouter } from "../../application/controllers/evento.controller";
import { createOrdemServicoRouter } from "../../application/controllers/ordem-servico.controller";
import { errorHandler } from "../../application/middleware/error-handler.middleware";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import {
  EResultadoEnvio,
  EStatusNotificacao,
} from "../../domain/ordem-servico/entity/evento.entity";
import { OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";
import {
  FakeOrcamentoRepository,
  FakeOrdemServicoRepository,
  ORCAMENTO_ID,
  orcamentoAprovadoSeed,
  ordemInput,
} from "../mocks/ordem-servico.fakes";

const VEICULO = "64a000000000000000000010";
const CLIENTE = "64a000000000000000000020";
const INEXISTENTE = "64d000000000000000000099";
const EVENTO_INEXISTENTE = "64e000000000000000000099";

async function makeApp() {
  const repo = new FakeOrdemServicoRepository();
  const orcamentoRepo = new FakeOrcamentoRepository();
  orcamentoRepo.items.push(orcamentoAprovadoSeed());
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
  // mesma montagem do app.ts
  app.use("/api/ordens-servico/:ordemServicoId/eventos", createEventoRouter(service));
  app.use("/api/ordens-servico", createOrdemServicoRouter(service));
  app.use(errorHandler);
  return { app, whatsapp };
}

async function criarOrdem(app: express.Express): Promise<string> {
  return (await request(app).post("/api/ordens-servico").send(ordemInput(EStatus.EM_ESPERA))).body.id;
}

describe("/api/ordens-servico/:ordemServicoId/eventos", () => {
  it("CRUD aninhado completo", async () => {
    const { app, whatsapp } = await makeApp();
    const ordemId = await criarOrdem(app);
    const base = `/api/ordens-servico/${ordemId}/eventos`;

    const lista = await request(app).get(base);
    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0]).toMatchObject({
      id: expect.any(String),
      status: EStatus.EM_ESPERA,
      data: expect.any(String),
      motivo: null,
      notificacao: { status: EStatusNotificacao.NAO_APLICAVEL },
    });

    const criado = await request(app).post(base).send({ status: EStatus.DIAGNOSTICO, data: "2026-10-20T13:00:00.000Z" });
    expect(criado.status).toBe(201);
    expect(criado.body).toMatchObject({
      id: expect.any(String),
      status: EStatus.DIAGNOSTICO,
      data: "2026-10-20T13:00:00.000Z",
      notificacao: { status: EStatusNotificacao.ENVIADA },
    });
    expect(whatsapp.enviar).toHaveBeenCalledTimes(1);
    const eventoId = criado.body.id;

    const um = await request(app).get(`${base}/${eventoId}`);
    expect(um.status).toBe(200);
    expect(um.body).toEqual(criado.body);

    const atualizado = await request(app).put(`${base}/${eventoId}`).send({ status: EStatus.AGUARDANDO_PECA });
    expect(atualizado.status).toBe(200);
    expect(atualizado.body.status).toBe(EStatus.AGUARDANDO_PECA);
    expect((await request(app).get(`/api/ordens-servico/${ordemId}`)).body.status).toBe(EStatus.AGUARDANDO_PECA);

    const removido = await request(app).delete(`${base}/${eventoId}`);
    expect(removido.status).toBe(204);
    expect((await request(app).get(base)).body).toHaveLength(1);
    expect((await request(app).get(`/api/ordens-servico/${ordemId}`)).body.status).toBe(EStatus.EM_ESPERA);
  });

  it("POST sem data usa a data atual", async () => {
    const { app } = await makeApp();
    const ordemId = await criarOrdem(app);
    const res = await request(app).post(`/api/ordens-servico/${ordemId}/eventos`).send({ status: EStatus.EM_SERVICO });
    expect(res.status).toBe(201);
    expect(Number.isNaN(Date.parse(res.body.data))).toBe(false);
  });

  it("400 para ids, status e data inválidos", async () => {
    const { app } = await makeApp();
    const ordemId = await criarOrdem(app);
    const base = `/api/ordens-servico/${ordemId}/eventos`;
    const eventoId = (await request(app).get(base)).body[0].id;

    expect((await request(app).get("/api/ordens-servico/abc/eventos")).status).toBe(400);
    expect((await request(app).get(`${base}/abc`)).status).toBe(400);
    expect((await request(app).put(`${base}/abc`).send({ status: EStatus.FINALIZADO })).status).toBe(400);
    expect((await request(app).delete(`${base}/abc`)).status).toBe(400);

    expect((await request(app).post(base).send({})).status).toBe(400);
    expect((await request(app).post(base).send({ status: "Aberto" })).status).toBe(400);
    expect((await request(app).post(base).send({ status: EStatus.FINALIZADO, data: "ontem" })).status).toBe(400);
    expect((await request(app).post(base).send({ status: EStatus.FINALIZADO, data: 123 })).status).toBe(400);

    expect((await request(app).put(`${base}/${eventoId}`).send({})).status).toBe(400);
    expect((await request(app).put(`${base}/${eventoId}`).send({ data: "x" })).status).toBe(400);
  });

  it("404 para ordem e evento inexistentes", async () => {
    const { app } = await makeApp();
    const ordemId = await criarOrdem(app);
    const semOrdem = `/api/ordens-servico/${INEXISTENTE}/eventos`;
    expect((await request(app).get(semOrdem)).status).toBe(404);
    expect((await request(app).post(semOrdem).send({ status: EStatus.FINALIZADO })).status).toBe(404);

    const base = `/api/ordens-servico/${ordemId}/eventos`;
    expect((await request(app).get(`${base}/${EVENTO_INEXISTENTE}`)).status).toBe(404);
    expect((await request(app).put(`${base}/${EVENTO_INEXISTENTE}`).send({ status: EStatus.FINALIZADO })).status).toBe(404);
    expect((await request(app).delete(`${base}/${EVENTO_INEXISTENTE}`)).status).toBe(404);
  });

  it("retorna 502 com eventoId e permite reenviar sem duplicar", async () => {
    const { app, whatsapp } = await makeApp();
    const ordemId = await criarOrdem(app);
    const base = `/api/ordens-servico/${ordemId}/eventos`;
    whatsapp.enviar.mockRejectedValueOnce(new Error("Falha de rede"));

    const falha = await request(app).post(base).send({ status: EStatus.DIAGNOSTICO });
    expect(falha.status).toBe(502);
    expect(falha.body).toMatchObject({
      eventoId: expect.any(String),
      resultadoEnvio: EResultadoEnvio.INCERTO,
    });
    expect(falha.body.error).toContain("pode duplicar a mensagem externa");

    const reenvio = await request(app)
      .post(`${base}/${falha.body.eventoId}/notificacao`)
      .send();
    expect(reenvio.status).toBe(200);
    expect(reenvio.body.notificacao.status).toBe(EStatusNotificacao.ENVIADA);
    expect((await request(app).get(base)).body).toHaveLength(2);
  });
});
