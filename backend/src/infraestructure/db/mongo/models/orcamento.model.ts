import { model } from "mongoose";
import { orcamentoSchema } from "../schema/orcamento.schema";

export const OrcamentoModel = model("Orcamento", orcamentoSchema);