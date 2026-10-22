import { model } from "mongoose";
import { ordemServicoSchema } from "../schema/ordem-servico.schema";

export const OrdemServicoModel = model("OrdemServico", ordemServicoSchema);
