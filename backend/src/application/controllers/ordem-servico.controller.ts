import { NextFunction, Request, Response, Router } from "express";
import { isValidObjectId } from "mongoose";
import { ValidationError } from "../../domain/common/errors/app-error";
import { EDecisao } from "../../domain/ordem-servico/entity/e-decisao";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { ETipo } from "../../domain/ordem-servico/entity/e-tipo";
import { ItemOrdem, OrdemServicoInput } from "../../domain/ordem-servico/entity/ordem-servico.entity";
import { OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";

function validaEnum<T extends string>(valor: unknown, permitidos: T[], campo: string): T {
  if (typeof valor !== "string" || !permitidos.includes(valor as T)) {
    throw new ValidationError(`Campo '${campo}' é inválido`);
  }
  return valor as T;
}

function validaInteiro(valor: unknown, campo: string): number {
  if (typeof valor !== "number" || !Number.isInteger(valor)) {
    throw new ValidationError(`Campo '${campo}' deve ser um inteiro`);
  }
  return valor;
}

function validaItens(itens: unknown): ItemOrdem[] {
  if (!Array.isArray(itens)) throw new ValidationError("Campo 'itens' é obrigatório");
  return itens.map((item, indice) => {
    if (typeof item?.descricao !== "string" || !item.descricao.trim()) {
      throw new ValidationError(`Campo 'itens[${indice}].descricao' é obrigatório`);
    }
    return {
      descricao: item.descricao.trim(),
      tipo: validaEnum(item.tipo, Object.values(ETipo), `itens[${indice}].tipo`),
      quantidade: validaInteiro(item.quantidade, `itens[${indice}].quantidade`),
      valorUnitario: validaInteiro(item.valorUnitario, `itens[${indice}].valorUnitario`),
    };
  });
}

function validaBody(body: any): OrdemServicoInput {
  if (!isValidObjectId(body?.veiculoId)) throw new ValidationError("Campo 'veiculoId' é inválido");
  if (!isValidObjectId(body?.clienteId)) throw new ValidationError("Campo 'clienteId' é inválido");
  if (typeof body?.descricao !== "string" || !body.descricao.trim()) {
    throw new ValidationError("Campo 'descricao' é obrigatório");
  }
  if (typeof body?.orcamento !== "number" || !Number.isFinite(body.orcamento)) {
    throw new ValidationError("Campo 'orcamento' deve ser um número");
  }
  const input: OrdemServicoInput = {
    veiculoId: body.veiculoId,
    clienteId: body.clienteId,
    decisao: validaEnum(body.decisao, Object.values(EDecisao), "decisao"),
    descricao: body.descricao.trim(),
    orcamento: body.orcamento,
    status: validaEnum(body.status, Object.values(EStatus), "status"),
    itens: validaItens(body.itens),
  };
  if (body.motivo !== undefined) {
    if (typeof body.motivo !== "string" || !body.motivo.trim()) {
      throw new ValidationError("Campo 'motivo' é obrigatório");
    }
    input.motivo = body.motivo.trim();
  }
  return input;
}

function validaId(id: string) {
  if (!isValidObjectId(id)) throw new ValidationError("Id inválido");
}

export function createOrdemServicoRouter(service: OrdemServicoService): Router {
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
