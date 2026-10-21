
import { model } from "mongoose";
import { usuarioSchema } from "../schema/usuario.schema";

export const UsuarioModel = model("Usuario", usuarioSchema);
