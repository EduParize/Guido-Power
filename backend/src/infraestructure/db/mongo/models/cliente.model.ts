import { model } from "mongoose";
import { clienteSchema } from "../schema/cliente.schema";

export const ClienteModel = model("Cliente", clienteSchema);
