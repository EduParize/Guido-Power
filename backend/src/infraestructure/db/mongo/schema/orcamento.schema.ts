import { InferSchemaType, Schema, Types } from "mongoose";
import { EDecisao } from "../../../../domain/orcamento/entity/e-decisao";
import { ETipo } from "../../../../domain/orcamento/entity/e-tipo";

const itemSchema = new Schema(
  {
    descricao: { type: String, required: true, trim: true },
    tipo: { type: String, enum: Object.values(ETipo), required: true },
    quantidade: { type: Number, required: true },
    valorUnitarioCentavos: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "valorUnitarioCentavos deve ser inteiro",
      },
    },
  },
  { _id: false },
);

export const orcamentoSchema = new Schema(
  {
    nome: { type: String, default: null, trim: true },
    telefone: { type: String, default: null, trim: true },
    placa: { type: String, default: null, trim: true, uppercase: true },
    decisao: { type: String, enum: Object.values(EDecisao), required: true },
    decisaoData: { type: Date, required: true },
    valorCentavos: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: "valorCentavos deve ser inteiro" },
    },
    itens: { type: [itemSchema], default: [] },
  },
  { timestamps: true },
);

export type OrcamentoDocument = InferSchemaType<typeof orcamentoSchema> & { _id: Types.ObjectId };
