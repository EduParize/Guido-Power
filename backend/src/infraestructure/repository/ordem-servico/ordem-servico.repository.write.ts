import { Types } from "mongoose";
import { EStatus } from "../../../domain/ordem-servico/entity/e-status";
import { Evento, EventoAtualizacao, EventoInput } from "../../../domain/ordem-servico/entity/evento.entity";
import { OrdemServico, OrdemServicoAtualizacao, OrdemServicoCriacao } from "../../../domain/ordem-servico/entity/ordem-servico.entity";
import { OrdemServicoRepositoryWrite } from "../../../domain/ordem-servico/repository/ordem-servico.repository.write";
import { OrdemServicoModel } from "../../db/mongo/models/ordem-servico.model";
import { EventoDocument, toEvento, toOrdemServico } from "./adapters/ordem-servico.adapter";

export class OrdemServicoRepositoryWriteMongo implements OrdemServicoRepositoryWrite {
  async create(data: OrdemServicoCriacao): Promise<OrdemServico> {
    const doc = await OrdemServicoModel.create(data);
    return toOrdemServico(doc.toObject());
  }

  async update(id: string, data: OrdemServicoAtualizacao): Promise<OrdemServico | null> {
    // $set só com os campos editáveis: status e historico ficam como estão.
    const doc = await OrdemServicoModel.findByIdAndUpdate(id, { $set: data }, {
      new: true,
      runValidators: true,
    }).lean();
    return doc ? toOrdemServico(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    return (await OrdemServicoModel.findByIdAndDelete(id)) !== null;
  }

  async addEvento(ordemId: string, evento: EventoInput, statusOrdem?: EStatus): Promise<Evento | null> {
    const _id = new Types.ObjectId();
    const resultado = await OrdemServicoModel.updateOne(
      { _id: ordemId },
      {
        $push: { historico: { _id, status: evento.status, data: evento.data } },
        ...(statusOrdem ? { $set: { status: statusOrdem } } : {}),
      },
      { runValidators: true },
    );
    if (resultado.matchedCount === 0) return null;
    return { id: _id.toString(), status: evento.status, data: evento.data };
  }

  async updateEvento(
    ordemId: string,
    eventoId: string,
    dados: EventoAtualizacao,
    statusOrdem?: EStatus,
  ): Promise<Evento | null> {
    const set: Record<string, unknown> = {};
    if (dados.status !== undefined) set["historico.$[evento].status"] = dados.status;
    if (dados.data !== undefined) set["historico.$[evento].data"] = dados.data;
    if (statusOrdem) set.status = statusOrdem;

    const _id = new Types.ObjectId(eventoId);
    const doc = await OrdemServicoModel.findOneAndUpdate(
      { _id: ordemId, "historico._id": _id },
      { $set: set },
      { arrayFilters: [{ "evento._id": _id }], new: true, runValidators: true },
    ).lean();
    const evento = ((doc?.historico ?? []) as EventoDocument[]).find((e) => e._id.equals(_id));
    return evento ? toEvento(evento) : null;
  }

  async removeEvento(ordemId: string, eventoId: string, statusOrdem?: EStatus): Promise<boolean> {
    const _id = new Types.ObjectId(eventoId);
    const resultado = await OrdemServicoModel.updateOne(
      { _id: ordemId, "historico._id": _id },
      {
        $pull: { historico: { _id } },
        ...(statusOrdem ? { $set: { status: statusOrdem } } : {}),
      },
    );
    return resultado.modifiedCount > 0;
  }
}
