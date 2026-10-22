import { ValidationError } from "../../domain/common/errors/app-error";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function validaObjectId(valor: string, mensagem = "Id inválido"): void {
  if (typeof valor !== "string" || !OBJECT_ID_PATTERN.test(valor)) {
    throw new ValidationError(mensagem);
  }
}
