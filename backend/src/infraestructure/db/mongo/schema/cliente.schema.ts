import { InferSchemaType, Schema } from "mongoose";

export const clienteSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    documento: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    telefone: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export type ClienteDocument = InferSchemaType<typeof clienteSchema> & {
  _id: import("mongoose").Types.ObjectId;
};
