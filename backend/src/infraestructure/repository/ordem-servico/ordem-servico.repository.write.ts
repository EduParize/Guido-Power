import { Types } from "mongoose";
import { EStatus } from "../../../domain/ordem-servico/entity/e-status";
import {
  EResultadoEnvio,
  EStatusNotificacao,
  EventoAtualizacao,
  EventoInput,
  NotificacaoEvento,
} from "../../../domain/ordem-servico/entity/evento.entity";
import { OrdemServico, OrdemServicoAtualizacao, OrdemServicoCriacao } from "../../../domain/ordem-servico/entity/ordem-servico.entity";
import {
  EventoMutado,
  OrdemServicoRepositoryWrite,
  ResultadoMutacao,
} from "../../../domain/ordem-servico/repository/ordem-servico.repository.write";
import { OrdemServicoModel } from "../../db/mongo/models/ordem-servico.model";
import { OrdemServicoDocument } from "../../db/mongo/schema/ordem-servico.schema";
import {
  toEventoPersistence,
  toOrdemServico,
  toOrdemServicoCreatePersistence,
  toOrdemServicoUpdatePersistence,
} from "./adapters/ordem-servico.adapter";

export class OrdemServicoRepositoryWriteMongo implements OrdemServicoRepositoryWrite {
  async create(data: OrdemServicoCriacao): Promise<OrdemServico> {
    const doc = await OrdemServicoModel.create(toOrdemServicoCreatePersistence(data));
    return toOrdemServico(doc.toObject());
  }

  async update(id: string, data: OrdemServicoAtualizacao): Promise<OrdemServico | null> {
    const persistencia = toOrdemServicoUpdatePersistence(data);
    const doc = await OrdemServicoModel.findByIdAndUpdate(
      id,
      { $set: persistencia },
      { returnDocument: "after", runValidators: true },
    ).lean();
    return doc ? toOrdemServico(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    return (await OrdemServicoModel.findByIdAndDelete(id)) !== null;
  }

  async addEvento(
    ordemId: string,
    evento: EventoInput,
    historicoVersao: number,
  ): Promise<ResultadoMutacao<EventoMutado>> {
    const _id = new Types.ObjectId();
    const doc = await OrdemServicoModel.findOneAndUpdate(
      {
        _id: ordemId,
        historicoVersao,
        status: { $ne: evento.status },
        $expr: {
          $ne: [
            { $arrayElemAt: ["$historico.notificacao.status", -1] },
            EStatusNotificacao.PENDENTE,
          ],
        },
      },
      {
        $push: { historico: { _id, ...toEventoPersistence(evento) } },
        $set: { status: evento.status },
        $inc: { historicoVersao: 1 },
      },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!doc) return this.classificaAusencia(ordemId);
    return this.resultadoEvento(doc, _id);
  }

  async updateEvento(
    ordemId: string,
    eventoId: string,
    dados: EventoAtualizacao,
    historicoVersao: number,
    statusOrdem?: EStatus,
  ): Promise<ResultadoMutacao<EventoMutado>> {
    const set: Record<string, unknown> = {};
    if (dados.status !== undefined) set["historico.$[evento].status"] = dados.status;
    if (dados.data !== undefined) set["historico.$[evento].data"] = dados.data;
    if (dados.motivo !== undefined) set["historico.$[evento].motivo"] = dados.motivo;
    if (dados.notificacao !== undefined) {
      set["historico.$[evento].notificacao"] = dados.notificacao;
    }
    if (statusOrdem !== undefined) set.status = statusOrdem;

    const _id = new Types.ObjectId(eventoId);
    const doc = await OrdemServicoModel.findOneAndUpdate(
      {
        _id: ordemId,
        historicoVersao,
        historico: {
          $elemMatch: {
            _id,
            "notificacao.status": { $ne: EStatusNotificacao.PENDENTE },
          },
        },
      },
      { $set: set, $inc: { historicoVersao: 1 } },
      {
        arrayFilters: [{ "evento._id": _id }],
        returnDocument: "after",
        runValidators: true,
      },
    ).lean();
    if (!doc) return this.classificaAusencia(ordemId, _id);
    return this.resultadoEvento(doc, _id);
  }

  async removeEvento(
    ordemId: string,
    eventoId: string,
    historicoVersao: number,
    statusOrdem?: EStatus,
  ): Promise<ResultadoMutacao<OrdemServico>> {
    const _id = new Types.ObjectId(eventoId);
    const set: Record<string, EStatus> = {};
    if (statusOrdem !== undefined) set.status = statusOrdem;

    const doc = await OrdemServicoModel.findOneAndUpdate(
      {
        _id: ordemId,
        historicoVersao,
        "historico.1": { $exists: true },
        historico: {
          $elemMatch: {
            _id,
            "notificacao.status": { $ne: EStatusNotificacao.PENDENTE },
          },
        },
      },
      {
        $pull: { historico: { _id } },
        $set: set,
        $inc: { historicoVersao: 1 },
      },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!doc) return this.classificaAusencia(ordemId, _id);
    return { tipo: "sucesso", valor: toOrdemServico(doc) };
  }

  async claimNotificacao(
    ordemId: string,
    eventoId: string,
    historicoVersao: number,
    notificacao: NotificacaoEvento,
    pendenteAntesDe: Date,
  ): Promise<ResultadoMutacao<EventoMutado>> {
    const _id = new Types.ObjectId(eventoId);
    const doc = await OrdemServicoModel.findOneAndUpdate(
      {
        _id: ordemId,
        historicoVersao,
        $expr: { $eq: [{ $arrayElemAt: ["$historico._id", -1] }, _id] },
        $or: [
          {
            historico: {
              $elemMatch: {
                _id,
                "notificacao.status": EStatusNotificacao.FALHA,
              },
            },
          },
          {
            historico: {
              $elemMatch: {
                _id,
                "notificacao.status": EStatusNotificacao.PENDENTE,
                "notificacao.ultimaTentativaEm": { $lte: pendenteAntesDe },
              },
            },
          },
        ],
      },
      {
        $set: { "historico.$[evento].notificacao": notificacao },
        $inc: { historicoVersao: 1 },
      },
      {
        arrayFilters: [{ "evento._id": _id }],
        returnDocument: "after",
        runValidators: true,
      },
    ).lean();
    if (!doc) return this.classificaAusencia(ordemId, _id);
    return this.resultadoEvento(doc, _id);
  }

  async finalizarNotificacao(
    ordemId: string,
    eventoId: string,
    tentativaId: string,
    status: EStatusNotificacao.ENVIADA | EStatusNotificacao.FALHA,
    resultadoEnvio: EResultadoEnvio | null,
  ): Promise<ResultadoMutacao<EventoMutado>> {
    const _id = new Types.ObjectId(eventoId);
    const doc = await OrdemServicoModel.findOneAndUpdate(
      {
        _id: ordemId,
        historico: {
          $elemMatch: {
            _id,
            "notificacao.status": EStatusNotificacao.PENDENTE,
            "notificacao.tentativaId": tentativaId,
          },
        },
      },
      {
        $set: {
          "historico.$[evento].notificacao.status": status,
          "historico.$[evento].notificacao.resultadoEnvio": resultadoEnvio,
        },
        $inc: { historicoVersao: 1 },
      },
      {
        arrayFilters: [{ "evento._id": _id }],
        returnDocument: "after",
        runValidators: true,
      },
    ).lean();
    if (!doc) return this.classificaAusencia(ordemId, _id);
    return this.resultadoEvento(doc, _id);
  }

  private resultadoEvento(
    doc: OrdemServicoDocument,
    eventoId: Types.ObjectId,
  ): ResultadoMutacao<EventoMutado> {
    const ordem = toOrdemServico(doc);
    const evento = ordem.historico.find((item) => item.id === eventoId.toString());
    if (!evento) return { tipo: "conflito" };
    return { tipo: "sucesso", valor: { ordem, evento } };
  }

  private async classificaAusencia<T>(
    ordemId: string,
    eventoId?: Types.ObjectId,
  ): Promise<ResultadoMutacao<T>> {
    const filtro: Record<string, unknown> = { _id: ordemId };
    if (eventoId) filtro["historico._id"] = eventoId;
    const existe = await OrdemServicoModel.exists(filtro);
    if (!existe) return { tipo: "nao_encontrado" };
    return { tipo: "conflito" };
  }
}
