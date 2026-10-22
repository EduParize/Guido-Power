import cors from "cors";
import express, { type Express } from "express";
import { errorHandler } from "./application/middleware/error-handler.middleware";

import usuarioController from "./application/controllers/usuario.controller";

import { createEventoRouter } from "./application/controllers/evento.controller";
import { createClienteRouter } from "./application/controllers/cliente.controller";
import { createOrdemServicoRouter } from "./application/controllers/ordem-servico.controller";
import { createVeiculoRouter } from "./application/controllers/veiculo.controller";
import { makeClienteService } from "./configuration/factory/cliente.factory";
import { makeOrdemServicoService } from "./configuration/factory/ordem-servico.factory";
import { makeVeiculoService } from "./configuration/factory/veiculo.factory";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/usuarios", usuarioController);
  app.use("/api/clientes", createClienteRouter(makeClienteService()));
  app.use("/api/veiculos", createVeiculoRouter(makeVeiculoService()));
  const ordemServicoService = makeOrdemServicoService();
  app.use("/api/ordens-servico/:ordemServicoId/eventos", createEventoRouter(ordemServicoService));
  app.use("/api/ordens-servico", createOrdemServicoRouter(ordemServicoService));

  app.use(errorHandler);

  return app;
}
