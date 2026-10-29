import { Router } from "express";
import { OrcamentoService } from "../../domain/orcamento/service/orcamento.service";
import { toOrcamentoInput, toOrcamentoResponse } from "../mappers/orcamento.mapper";
import { validaOrcamentoBody } from "../validation/orcamento.validation";
// AJUSTE: use o validador de id que já existe no projeto (nome e caminho reais)
import { validaObjectId } from "../validation/object-id.validator";

export function createOrcamentoRouter(service: OrcamentoService): Router {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      const lista = await service.list();
      res.status(200).json(lista.map(toOrcamentoResponse));
    } catch (e) {
      next(e);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      validaObjectId(req.params.id);
      res.status(200).json(toOrcamentoResponse(await service.getById(req.params.id)));
    } catch (e) {
      next(e);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const input = toOrcamentoInput(validaOrcamentoBody(req.body));
      res.status(201).json(toOrcamentoResponse(await service.create(input)));
    } catch (e) {
      next(e);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      validaObjectId(req.params.id);
      const input = toOrcamentoInput(validaOrcamentoBody(req.body));
      res.status(200).json(toOrcamentoResponse(await service.update(req.params.id, input)));
    } catch (e) {
      next(e);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      validaObjectId(req.params.id);
      await service.delete(req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  return router;
}