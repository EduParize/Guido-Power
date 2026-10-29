import { NextFunction, Request, Response, Router } from "express";
import { ValidationError } from "../../domain/common/errors/app-error";
import { ClienteInput } from "../../domain/cliente/entity/cliente.entity";
import { ClienteService } from "../../domain/cliente/service/cliente.service";
import { validaObjectId } from "../validation/object-id.validator";

const CAMPOS_TEXTO = ["nome", "documento", "email", "telefone"] as const;

function validaBodyCompleto(body: any): ClienteInput {
  for (const campo of CAMPOS_TEXTO) {
    if (typeof body?.[campo] !== "string" || !body[campo].trim()) {
      throw new ValidationError(`Campo '${campo}' é obrigatório`);
    }
  }
  return {
    nome: body.nome.trim(),
    documento: body.documento.trim(),
    email: body.email.trim(),
    telefone: body.telefone.trim(),
  };
}

function validaBodyFromOrcamento(body: any): { orcamentoId: string; documento: string; email: string } {
  validaObjectId(body?.orcamentoId, "Campo 'orcamentoId' é inválido");
  if (typeof body?.documento !== "string" || !body.documento.trim()) {
    throw new ValidationError("Campo 'documento' é obrigatório");
  }
  if (typeof body?.email !== "string" || !body.email.trim()) {
    throw new ValidationError("Campo 'email' é obrigatório");
  }
  return {
    orcamentoId: body.orcamentoId,
    documento: body.documento.trim(),
    email: body.email.trim(),
  };
}

function validaId(id: string) {
  validaObjectId(id);
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
      if (req.body?.orcamentoId !== undefined) {
        res.status(201).json(await service.createFromOrcamento(validaBodyFromOrcamento(req.body)));
        return;
      }
      res.status(201).json(await service.create(validaBodyCompleto(req.body)));
    } catch (e) {
      next(e);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      validaId(req.params.id);
      res.status(200).json(await service.update(req.params.id, validaBodyCompleto(req.body)));
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
