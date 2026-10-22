import { model } from "mongoose";
import { veiculoSchema } from "../schema/veiculo.schema";

export const VeiculoModel = model("Veiculo", veiculoSchema);