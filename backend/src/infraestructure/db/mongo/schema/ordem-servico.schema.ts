import { InferSchemaType, Schema } from "mongoose";
import { EStatus } from "../../../../domain/ordem-servico/entity/e-status";
import {
  EResultadoEnvio,
  EStatusNotificacao,
} from "../../../../domain/ordem-servico/entity/evento.entity";

const notificacaoSchema = new Schema(
  {
    status: { type: String, enum: Object.values(EStatusNotificacao), required: true },
    tentativaId: { type: String, default: null },
    ultimaTentativaEm: { type: Date, default: null },
    resultadoEnvio: { type: String, enum: Object.values(EResultadoEnvio), default: null },
  },
  { _id: false },
);

const eventoSchema = new Schema({
  data: { type: Date, required: true },
  status: { type: String, enum: Object.values(EStatus), required: true },
  motivo: { type: String, default: null },
  notificacao: { type: notificacaoSchema, required: true },
});

export const ordemServicoSchema = new Schema(
  {
    veiculoId: { type: Schema.Types.ObjectId, ref: "Veiculo", required: true, index: true },
    clienteId: { type: Schema.Types.ObjectId, ref: "Cliente", required: true, index: true },
    orcamentoId: {
      type: Schema.Types.ObjectId,
      ref: "Orcamento",
      required: true,
      unique: true,
      index: true,
    },
    descricao: { type: String, required: true, trim: true },
    status: { type: String, enum: Object.values(EStatus), required: true },
    historico: { type: [eventoSchema], default: [] },
    historicoVersao: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type OrdemServicoDocument = InferSchemaType<typeof ordemServicoSchema> & {
  _id: import("mongoose").Types.ObjectId;
};
