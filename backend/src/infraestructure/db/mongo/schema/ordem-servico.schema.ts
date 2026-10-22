import { InferSchemaType, Schema } from "mongoose";
import { EDecisao } from "../../../../domain/ordem-servico/entity/e-decisao";
import { EStatus } from "../../../../domain/ordem-servico/entity/e-status";
import { ETipo } from "../../../../domain/ordem-servico/entity/e-tipo";
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

const itemSchema = new Schema(
  {
    descricao: { type: String, required: true, trim: true },
    tipo: { type: String, enum: Object.values(ETipo), required: true },
    quantidade: { type: Number, required: true },
    valorUnitario: {
      type: Number,
      required: true,
      validate: { validator: Number.isInteger, message: "valorUnitario deve estar em centavos inteiros" },
    },
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
    orcamento: {
      type: Number,
      required: true,
      validate: { validator: Number.isInteger, message: "orcamento deve estar em centavos inteiros" },
    },
    status: { type: String, enum: Object.values(EStatus), required: true },
    historico: { type: [eventoSchema], default: [] },
    historicoVersao: { type: Number, required: true, default: 0 },
    itens: { type: [itemSchema], default: [] },
  },
  { timestamps: true },
);

export type OrdemServicoDocument = InferSchemaType<typeof ordemServicoSchema> & {
  _id: import("mongoose").Types.ObjectId;
};
