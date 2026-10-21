import cors from "cors";
import express, { type Express } from "express";
import { errorHandler } from "./application/middleware/error-handler.middleware";

import usuarioController from "./application/controllers/usuario.controller";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/usuarios", usuarioController);
  
  app.use(errorHandler);

  return app;
}
