import { ValidationError } from "../../domain/common/errors/app-error";
import { EDecisao } from "../../domain/orcamento/entity/e-decisao";
import { ETipo } from "../../domain/orcamento/entity/e-tipo";
import {
  ItemOrcamentoRequest,
  OrcamentoCreateRequest,
  OrcamentoUpdateRequest,
} from "../mappers/orcamento.mapper";

function validaEnum<T extends string>(valor: unknown, permitidos: T[], campo: string): T {
  if (typeof valor !== "string" || !permitidos.includes(valor as T)) {
    throw new ValidationError(`Campo '${campo}' é inválido`);
  }
  return valor as T;
}

function validaInteiroPositivo(valor: unknown, campo: string): number {
  if (typeof valor !== "number" || !Number.isInteger(valor) || valor <= 0) {
    throw new ValidationError(`Campo '${campo}' deve ser um inteiro positivo`);
  }
  return valor;
}

function validaNumeroNaoNegativo(valor: unknown, campo: string): number {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0) {
    throw new ValidationError(`Campo '${campo}' deve ser um número não negativo`);
  }
  return valor;
}

function textoOpcional(valor: unknown, campo: string): string | null {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== "string") {
    throw new ValidationError(`Campo '${campo}' deve ser um texto`);
  }
  const texto = valor.trim();
  return texto || null;
}

function validaTelefoneOpcional(valor: unknown): string | null {
  const telefone = textoOpcional(valor, "telefone");
  if (!telefone) return null;
  const digitos = telefone.replace(/\D/g, "");
  if (!/^\d{10,11}$/.test(digitos)) {
    throw new ValidationError("Campo 'telefone' deve ser um telefone nacional válido");
  }
  return telefone;
}

function validaPlacaOpcional(valor: unknown): string | null {
  const placa = textoOpcional(valor, "placa");
  return placa ? placa.toUpperCase() : null;
}

function validaItens(itens: unknown): ItemOrcamentoRequest[] {
  if (!Array.isArray(itens)) throw new ValidationError("Campo 'itens' é obrigatório");
  return itens.map((item, indice) => {
    if (typeof item?.descricao !== "string" || !item.descricao.trim()) {
      throw new ValidationError(`Campo 'itens[${indice}].descricao' é obrigatório`);
    }
    return {
      descricao: item.descricao.trim(),
      tipo: validaEnum(item.tipo, Object.values(ETipo), `itens[${indice}].tipo`),
      quantidade: validaInteiroPositivo(item.quantidade, `itens[${indice}].quantidade`),
      valorUnitario: validaNumeroNaoNegativo(item.valorUnitario, `itens[${indice}].valorUnitario`),
    };
  });
}

function validaLeadEItens(body: unknown): OrcamentoCreateRequest {
  const payload = body as {
    nome?: unknown;
    telefone?: unknown;
    placa?: unknown;
    itens?: unknown;
  };
  return {
    nome: textoOpcional(payload?.nome, "nome"),
    telefone: validaTelefoneOpcional(payload?.telefone),
    placa: validaPlacaOpcional(payload?.placa),
    itens: validaItens(payload?.itens),
  };
}

export function validaOrcamentoCreateBody(body: unknown): OrcamentoCreateRequest {
  return validaLeadEItens(body);
}

export function validaOrcamentoUpdateBody(body: unknown): OrcamentoUpdateRequest {
  const payload = body as { decisao?: unknown };
  const decisao = payload?.decisao === undefined
    ? EDecisao.PENDENTE
    : validaEnum(payload.decisao, Object.values(EDecisao), "decisao");
  return {
    ...validaLeadEItens(body),
    decisao,
  };
}
