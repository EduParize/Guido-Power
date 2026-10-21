
import { Schema } from "mongoose";

export const usuarioSchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    senhaHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
