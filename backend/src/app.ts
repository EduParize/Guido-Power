import cors from "cors";
import express, { type Express } from "express";
import { errorHandler } from "./application/middleware/error-handler.middleware";

import usuarioController from "./application/controllers/usuario.controller";

import { createClienteRouter } from "./application/controllers/cliente.controller";
import { createVeiculoRouter } from "./application/controllers/veiculo.controller";
import { makeClienteService } from "./configuration/factory/cliente.factory";
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
  
  app.use(errorHandler);

  return app;
}
