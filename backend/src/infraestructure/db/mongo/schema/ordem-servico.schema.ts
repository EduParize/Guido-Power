import { InferSchemaType, Schema } from "mongoose";
import { EDecisao } from "../../../../domain/ordem-servico/entity/e-decisao";
import { EStatus } from "../../../../domain/ordem-servico/entity/e-status";
import { ETipo } from "../../../../domain/ordem-servico/entity/e-tipo";

const eventoSchema = new Schema(
  {
    data: { type: Date, required: true },
    status: { type: String, enum: Object.values(EStatus), required: true },
    motivo: { type: String, default: null },
  },
  { _id: false },
);

const itemSchema = new Schema(
  {
    descricao: { type: String, required: true, trim: true },
    tipo: { type: String, enum: Object.values(ETipo), required: true },
    quantidade: { type: Number, required: true },
    valorUnitario: { type: Number, required: true },
  },
  { _id: false },
);

export const ordemServicoSchema = new Schema(
  {
    veiculoId: { type: Schema.Types.ObjectId, ref: "Veiculo", required: true, index: true },
    clienteId: { type: Schema.Types.ObjectId, ref: "Cliente", required: true, index: true },
    decisao: { type: String, enum: Object.values(EDecisao), required: true },
    decisaoData: { type: Date, required: true },
    descricao: { type: String, required: true, trim: true },
    orcamento: { type: Number, required: true },
    status: { type: String, enum: Object.values(EStatus), required: true },
    historico: { type: [eventoSchema], default: [] },
    itens: { type: [itemSchema], default: [] },
  },
  { timestamps: true },
);

export type OrdemServicoDocument = InferSchemaType<typeof ordemServicoSchema> & {
  _id: import("mongoose").Types.ObjectId;
};
