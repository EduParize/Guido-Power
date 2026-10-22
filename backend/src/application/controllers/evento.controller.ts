import { Request, Router } from "express";
import { ValidationError } from "../../domain/common/errors/app-error";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { EventoAtualizacao } from "../../domain/ordem-servico/entity/evento.entity";
import { NovoEvento, OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";
import { validaObjectId } from "../validation/object-id.validator";

function validaId(id: string, campo: string) {
  validaObjectId(id, `Id de ${campo} inválido`);
}

// Com mergeParams o :ordemServicoId vem do prefixo montado no app.ts.
function idOrdem(req: Request): string {
  const id = (req.params as Record<string, string>).ordemServicoId;
  validaId(id, "ordem de serviço");
  return id;
}

function idEvento(req: Request): string {
  const id = (req.params as Record<string, string>).eventoId;
  validaId(id, "evento");
  return id;
}

function validaStatus(valor: unknown): EStatus {
  if (typeof valor !== "string" || !Object.values(EStatus).includes(valor as EStatus)) {
    throw new ValidationError("Campo 'status' é inválido");
  }
  return valor as EStatus;
}

function validaData(valor: unknown): Date {
  const data = typeof valor === "string" && valor.trim() ? new Date(valor) : null;
  if (!data || Number.isNaN(data.getTime())) {
    throw new ValidationError("Campo 'data' deve ser uma data válida");
  }
  return data;
}

function validaBodyCriacao(body: any): NovoEvento {
  const input: NovoEvento = { status: validaStatus(body?.status) };
  if (body?.data !== undefined) input.data = validaData(body.data);
  if (body?.motivo !== undefined) input.motivo = validaMotivo(body.motivo);
  return input;
}

function validaBodyAtualizacao(body: any): EventoAtualizacao {
  const dados: EventoAtualizacao = {};
  if (body?.status !== undefined) dados.status = validaStatus(body.status);
  if (body?.data !== undefined) dados.data = validaData(body.data);
  if (body?.motivo !== undefined) dados.motivo = validaMotivo(body.motivo);
  if (dados.status === undefined && dados.data === undefined && dados.motivo === undefined) {
    throw new ValidationError("Informe 'status', 'data' ou 'motivo' para atualizar o evento");
  }
  return dados;
}

function validaMotivo(valor: unknown): string {
  if (typeof valor !== "string" || !valor.trim()) {
    throw new ValidationError("Campo 'motivo' deve ser um texto preenchido");
  }
  return valor.trim();
}

export function createEventoRouter(service: OrdemServicoService): Router {
  const router = Router({ mergeParams: true });

  router.get("/", async (req, res, next) => {
    try {
      const ordemId = idOrdem(req);
      res.status(200).json(await service.listEventos(ordemId));
    } catch (e) {
      next(e);
    }
  });

  router.get("/:eventoId", async (req, res, next) => {
    try {
      const ordemId = idOrdem(req);
      const eventoId = idEvento(req);
      res.status(200).json(await service.getEvento(ordemId, eventoId));
    } catch (e) {
      next(e);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const ordemId = idOrdem(req);
      res.status(201).json(await service.addEvento(ordemId, validaBodyCriacao(req.body)));
    } catch (e) {
      next(e);
    }
  });

  router.put("/:eventoId", async (req, res, next) => {
    try {
      const ordemId = idOrdem(req);
      const eventoId = idEvento(req);
      res.status(200).json(
        await service.updateEvento(ordemId, eventoId, validaBodyAtualizacao(req.body)),
      );
    } catch (e) {
      next(e);
    }
  });

  router.post("/:eventoId/notificacao", async (req, res, next) => {
    try {
      const ordemId = idOrdem(req);
      const eventoId = idEvento(req);
      res.status(200).json(await service.reenviarNotificacao(ordemId, eventoId));
    } catch (e) {
      next(e);
    }
  });

  router.delete("/:eventoId", async (req, res, next) => {
    try {
      const ordemId = idOrdem(req);
      const eventoId = idEvento(req);
      await service.removeEvento(ordemId, eventoId);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  return router;
}
