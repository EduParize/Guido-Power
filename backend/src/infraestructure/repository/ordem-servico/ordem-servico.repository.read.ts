import { isValidObjectId, Types } from "mongoose";
import { Evento } from "../../../domain/ordem-servico/entity/evento.entity";
import { OrdemServico } from "../../../domain/ordem-servico/entity/ordem-servico.entity";
import { OrdemServicoRepositoryRead } from "../../../domain/ordem-servico/repository/ordem-servico.repository.read";
import { OrdemServicoModel } from "../../db/mongo/models/ordem-servico.model";
import { EventoDocument, toEvento, toOrdemServico } from "./adapters/ordem-servico.adapter";

export class OrdemServicoRepositoryReadMongo implements OrdemServicoRepositoryRead {
  async findById(id: string): Promise<OrdemServico | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await OrdemServicoModel.findById(id).lean();
    return doc ? toOrdemServico(doc) : null;
  }

  async list(): Promise<OrdemServico[]> {
    return (await OrdemServicoModel.find().lean()).map(toOrdemServico);
  }

  async existsByVeiculoId(veiculoId: string): Promise<boolean> {
    return (await OrdemServicoModel.exists({ veiculoId })) !== null;
  }

  async listEventos(ordemId: string): Promise<Evento[] | null> {
    if (!isValidObjectId(ordemId)) return null;
    const doc = await OrdemServicoModel.findById(ordemId, { historico: 1 }).lean();
    if (!doc) return null;
    return ((doc.historico ?? []) as EventoDocument[]).map(toEvento);
  }

  async findEventoById(ordemId: string, eventoId: string): Promise<Evento | null> {
    if (!isValidObjectId(ordemId) || !isValidObjectId(eventoId)) return null;
    // $elemMatch na projeção traz só o evento procurado. O Mongoose não faz cast
    // de valores na projeção, por isso o ObjectId explícito.
    const _id = new Types.ObjectId(eventoId);
    const doc = await OrdemServicoModel.findOne(
      { _id: ordemId, "historico._id": _id },
      { historico: { $elemMatch: { _id } } },
    ).lean();
    const evento = (doc?.historico as EventoDocument[] | undefined)?.[0];
    return evento ? toEvento(evento) : null;
  }
}
