import { InferSchemaType, Schema } from "mongoose";

export const veiculoSchema = new Schema(
  {
    modelo: { type: String, required: true, trim: true },
    ano: { type: String, required: true, trim: true },
    marca: { type: String, required: true, trim: true },
    placa: { type: String, required: true, unique: true, trim: true, uppercase: true },
    dono: { type: Schema.Types.ObjectId, ref: "Cliente", required: true, index: true },
  },
  { timestamps: true },
);

export type VeiculoDocument = InferSchemaType<typeof veiculoSchema> & {
  _id: import("mongoose").Types.ObjectId;
};