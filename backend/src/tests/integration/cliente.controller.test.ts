import express from "express";
import request from "supertest";
import { createClienteRouter } from "../../application/controllers/cliente.controller";
import { errorHandler } from "../../application/middleware/error-handler.middleware";
import { ClienteService } from "../../domain/cliente/service/cliente.service";
import { FakeClienteRepository } from "../mocks/cliente.fakes";

const body = { nome: "Ana", documento: "12345678900", email: "ana@email.com" };

function makeApp() {
  const repo = new FakeClienteRepository();
  const service = new ClienteService(
    repo,
    repo,
    { existsByClienteId: async () => false } as any,
  );
  const app = express();
  app.use(express.json());
  app.use("/api/clientes", createClienteRouter(service));
  app.use(errorHandler);
  return app;
}

describe("/api/clientes", () => {
  it("CRUD completo", async () => {
    const app = makeApp();

    const created = await request(app).post("/api/clientes").send(body);
    expect(created.status).toBe(201);
    const id = created.body.id;

    expect((await request(app).get("/api/clientes")).body).toHaveLength(1);
    expect((await request(app).get(`/api/clientes/${id}`)).status).toBe(200);

    const upd = await request(app).put(`/api/clientes/${id}`).send({ ...body, nome: "Ana Souza" });
    expect(upd.status).toBe(200);
    expect(upd.body.nome).toBe("Ana Souza");

    expect((await request(app).delete(`/api/clientes/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/clientes/${id}`)).status).toBe(404);
  });

  it("400 com body inválido e 409 com e-mail ou documento duplicado", async () => {
    const app = makeApp();
    expect((await request(app).post("/api/clientes").send({ ...body, nome: "" })).status).toBe(400);

    await request(app).post("/api/clientes").send(body);
    expect((await request(app).post("/api/clientes").send(body)).status).toBe(409);
    expect((
      await request(app).post("/api/clientes").send({ ...body, email: "outro@email.com" })
    ).status).toBe(409);
  });
});
