import { InferSchemaType, Schema, Types } from "mongoose";

export const orcamentoSchema = new Schema(
  {
    valorCentavos: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: "valorCentavos deve ser inteiro" },
    },
  },
  { timestamps: true },
);

export type OrcamentoDocument = InferSchemaType<typeof orcamentoSchema> & { _id: Types.ObjectId };