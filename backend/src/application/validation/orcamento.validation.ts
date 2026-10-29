import { ValidationError } from "../../domain/common/errors/app-error";

export function validaOrcamentoBody(body: any): { valor: number } {
  const valor = body?.valor;
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new ValidationError("Campo 'valor' é obrigatório e deve ser numérico");
  }
  if (valor < 0) {
    throw new ValidationError("Campo 'valor' não pode ser negativo");
  }
  const centavos = valor * 100;
  if (Math.abs(centavos - Math.round(centavos)) > 1e-6) {
    throw new ValidationError("Campo 'valor' deve ter no máximo 2 casas decimais");
  }
  if (!Number.isSafeInteger(Math.round(centavos))) {
    throw new ValidationError("Campo 'valor' fora do limite permitido");
  }
  return { valor };
}