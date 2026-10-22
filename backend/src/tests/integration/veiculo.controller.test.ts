import express from "express";
import request from "supertest";
import { createVeiculoRouter } from "../../application/controllers/veiculo.controller";
import { errorHandler } from "../../application/middleware/error-handler.middleware"; // ajuste o nome do export
import { VeiculoService } from "../../domain/veiculo/service/veiculo.service";
import { FakeVeiculoRepository } from "../mocks/veiculo.fakes";

const DONO = "64a000000000000000000001";
const OUTRO = "64a000000000000000000002";
const body = { modelo: "Uno", ano: "2010", marca: "Fiat", placa: "ABC1234", dono: DONO };

function makeApp() {
  const repo = new FakeVeiculoRepository();
  const service = new VeiculoService(
    repo, repo,
    { findById: async (id: string) => ({ id }) } as any,
    { existsByVeiculoId: async () => false } as any,
  );
  const app = express();
  app.use(express.json());
  app.use("/api/veiculos", createVeiculoRouter(service));
  app.use(errorHandler);
  return app;
}

describe("/api/veiculos", () => {
  it("CRUD completo", async () => {
    const app = makeApp();

    const created = await request(app).post("/api/veiculos").send(body);
    expect(created.status).toBe(201);
    const id = created.body.id;

    expect((await request(app).get("/api/veiculos")).body).toHaveLength(1);
    expect((await request(app).get(`/api/veiculos/${id}`)).status).toBe(200);

    const upd = await request(app).put(`/api/veiculos/${id}`).send({ ...body, modelo: "Palio" });
    expect(upd.status).toBe(200);
    expect(upd.body.modelo).toBe("Palio");

    expect((await request(app).delete(`/api/veiculos/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/veiculos/${id}`)).status).toBe(404);
  });

  it("400 com body inválido e 409 com placa duplicada", async () => {
    const app = makeApp();
    expect((await request(app).post("/api/veiculos").send({ ...body, modelo: "" })).status).toBe(400);
    await request(app).post("/api/veiculos").send(body);
    expect((await request(app).post("/api/veiculos").send(body)).status).toBe(409);
  });

  it("filtra por clienteId", async () => {
    const app = makeApp();
    await request(app).post("/api/veiculos").send(body);
    await request(app).post("/api/veiculos").send({ ...body, placa: "XYZ9876", dono: OUTRO });

    const res = await request(app).get(`/api/veiculos?clienteId=${OUTRO}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].dono).toBe(OUTRO);
  });
});