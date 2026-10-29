import { NextFunction, Request, Response, Router } from "express";
import { ValidationError } from "../../domain/common/errors/app-error";
import { VeiculoInput } from "../../domain/veiculo/entity/veiculo.entity";
import { VeiculoService } from "../../domain/veiculo/service/veiculo.service";
import { validaObjectId } from "../validation/object-id.validator";

const CAMPOS_TEXTO = ["modelo", "ano", "marca", "placa"] as const;
const CAMPOS_FROM_ORCAMENTO = ["modelo", "ano", "marca"] as const;

function validaBodyCompleto(body: any): VeiculoInput {
  for (const campo of CAMPOS_TEXTO) {
    if (typeof body?.[campo] !== "string" || !body[campo].trim()) {
      throw new ValidationError(`Campo '${campo}' é obrigatório`);
    }
  }
  if (typeof body.dono !== "string") {
    throw new ValidationError("Campo 'dono' é obrigatório e deve ser um id válido");
  }
  validaObjectId(body.dono, "Campo 'dono' é obrigatório e deve ser um id válido");
  return {
    modelo: body.modelo.trim(),
    ano: body.ano.trim(),
    marca: body.marca.trim(),
    placa: body.placa.trim(),
    dono: body.dono,
  };
}

function validaBodyFromOrcamento(body: any): {
  orcamentoId: string;
  dono: string;
  marca: string;
  modelo: string;
  ano: string;
} {
  validaObjectId(body?.orcamentoId, "Campo 'orcamentoId' é inválido");
  if (typeof body?.dono !== "string") {
    throw new ValidationError("Campo 'dono' é obrigatório e deve ser um id válido");
  }
  validaObjectId(body.dono, "Campo 'dono' é obrigatório e deve ser um id válido");
  for (const campo of CAMPOS_FROM_ORCAMENTO) {
    if (typeof body?.[campo] !== "string" || !body[campo].trim()) {
      throw new ValidationError(`Campo '${campo}' é obrigatório`);
    }
  }
  return {
    orcamentoId: body.orcamentoId,
    dono: body.dono,
    marca: body.marca.trim(),
    modelo: body.modelo.trim(),
    ano: body.ano.trim(),
  };
}

function validaId(id: string) {
  validaObjectId(id);
}

export function createVeiculoRouter(service: VeiculoService): Router {
  const router = Router();

  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { clienteId } = req.query;
      if (clienteId !== undefined) {
        if (typeof clienteId !== "string") {
          throw new ValidationError("Query 'clienteId' inválida");
        }
        validaObjectId(clienteId, "Query 'clienteId' inválida");
      }
      res.status(200).json(await service.list(clienteId as string | undefined));
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
