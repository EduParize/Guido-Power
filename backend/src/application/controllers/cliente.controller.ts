import { NextFunction, Request, Response, Router } from "express";
import { isValidObjectId } from "mongoose";
import { ValidationError } from "../../domain/common/errors/app-error";
import { ClienteInput } from "../../domain/cliente/entity/cliente.entity";
import { ClienteService } from "../../domain/cliente/service/cliente.service";

const CAMPOS_TEXTO = ["nome", "documento", "email"] as const;

function validaBody(body: any): ClienteInput {
  for (const campo of CAMPOS_TEXTO) {
    if (typeof body?.[campo] !== "string" || !body[campo].trim()) {
      throw new ValidationError(`Campo '${campo}' é obrigatório`);
    }
  }
  return {
    nome: body.nome.trim(),
    documento: body.documento.trim(),
    email: body.email.trim(),
  };
}

function validaId(id: string) {
  if (!isValidObjectId(id)) throw new ValidationError("Id inválido");
}

export function createClienteRouter(service: ClienteService): Router {
  const router = Router();

  router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await service.list());
    } catch (e) {
      next(e);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      validaId(req.params.id);
      res.status(200).json(await service.getById(req.params.id));
    } catch (e) {
      next(e);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      res.status(201).json(await service.create(validaBody(req.body)));
    } catch (e) {
      next(e);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      validaId(req.params.id);
      res.status(200).json(await service.update(req.params.id, validaBody(req.body)));
    } catch (e) {
      next(e);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      validaId(req.params.id);
      await service.delete(req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  return router;
}
