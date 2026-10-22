import { NextFunction, Request, Response, Router } from "express";
import { ValidationError } from "../../domain/common/errors/app-error";
import { EDecisao } from "../../domain/ordem-servico/entity/e-decisao";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { ETipo } from "../../domain/ordem-servico/entity/e-tipo";
import { OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";
import {
  ItemOrdemRequest,
  OrdemServicoBaseRequest,
  OrdemServicoCreateRequest,
  toOrdemServicoInput,
  toOrdemServicoResponse,
  toOrdemServicoUpdateInput,
} from "../mappers/ordem-servico.mapper";
import { validaObjectId } from "../validation/object-id.validator";

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

function validaNumero(valor: unknown, campo: string): number {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new ValidationError(`Campo '${campo}' deve ser um número`);
  }
  return valor;
}

function validaItens(itens: unknown): ItemOrdemRequest[] {
  if (!Array.isArray(itens)) throw new ValidationError("Campo 'itens' é obrigatório");
  return itens.map((item, indice) => {
    if (typeof item?.descricao !== "string" || !item.descricao.trim()) {
      throw new ValidationError(`Campo 'itens[${indice}].descricao' é obrigatório`);
    }
    return {
      descricao: item.descricao.trim(),
      tipo: validaEnum(item.tipo, Object.values(ETipo), `itens[${indice}].tipo`),
      quantidade: validaInteiro(item.quantidade, `itens[${indice}].quantidade`),
      valorUnitario: validaNumero(item.valorUnitario, `itens[${indice}].valorUnitario`),
    };
  });
}

function validaBodyBase(body: any): OrdemServicoBaseRequest {
  validaObjectId(body?.veiculoId, "Campo 'veiculoId' é inválido");
  validaObjectId(body?.clienteId, "Campo 'clienteId' é inválido");
  if (typeof body?.descricao !== "string" || !body.descricao.trim()) {
    throw new ValidationError("Campo 'descricao' é obrigatório");
  }
  return {
    veiculoId: body.veiculoId,
    clienteId: body.clienteId,
    decisao: validaEnum(body.decisao, Object.values(EDecisao), "decisao"),
    descricao: body.descricao.trim(),
    orcamento: validaNumero(body.orcamento, "orcamento"),
    itens: validaItens(body.itens),
  };
}

function validaBodyCriacao(body: any): OrdemServicoCreateRequest {
  const request: OrdemServicoCreateRequest = {
    ...validaBodyBase(body),
    status: validaEnum(body?.status, Object.values(EStatus), "status"),
  };
  if (body?.motivo !== undefined) {
    if (typeof body.motivo !== "string" || !body.motivo.trim()) {
      throw new ValidationError("Campo 'motivo' deve ser um texto preenchido");
    }
    request.motivo = body.motivo.trim();
  }
  return request;
}

function validaBodyAtualizacao(body: any): OrdemServicoBaseRequest {
  if (body?.status !== undefined || body?.motivo !== undefined) {
    throw new ValidationError(
      "Campos 'status' e 'motivo' só podem ser alterados pelos eventos da ordem de serviço",
    );
  }
  return validaBodyBase(body);
}

export function createOrdemServicoRouter(service: OrdemServicoService): Router {
  const router = Router();

  router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const ordens = await service.list();
      res.status(200).json(ordens.map(toOrdemServicoResponse));
    } catch (e) {
      next(e);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      validaObjectId(req.params.id);
      const ordem = await service.getById(req.params.id);
      res.status(200).json(toOrdemServicoResponse(ordem));
    } catch (e) {
      next(e);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const input = toOrdemServicoInput(validaBodyCriacao(req.body));
      const ordem = await service.create(input);
      res.status(201).json(toOrdemServicoResponse(ordem));
    } catch (e) {
      next(e);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      validaObjectId(req.params.id);
      const input = toOrdemServicoUpdateInput(validaBodyAtualizacao(req.body));
      const ordem = await service.update(req.params.id, input);
      res.status(200).json(toOrdemServicoResponse(ordem));
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
