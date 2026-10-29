import { ValidationError } from "../../domain/common/errors/app-error";
import { EDecisao } from "../../domain/orcamento/entity/e-decisao";
import { ETipo } from "../../domain/orcamento/entity/e-tipo";
import {
  Orcamento,
  OrcamentoCreateInput,
  OrcamentoInput,
  totalCentavosDosItens,
} from "../../domain/orcamento/entity/orcamento.entity";

export type ItemOrcamentoRequest = {
  descricao: string;
  tipo: ETipo;
  quantidade: number;
  valorUnitario: number;
};

export type OrcamentoCreateRequest = {
  nome: string | null;
  telefone: string | null;
  placa: string | null;
  itens: ItemOrcamentoRequest[];
};

export type OrcamentoUpdateRequest = OrcamentoCreateRequest & {
  decisao: EDecisao;
};

function mapearItens(itens: ItemOrcamentoRequest[]) {
  return itens.map((item, indice) => ({
    descricao: item.descricao,
    tipo: item.tipo,
    quantidade: item.quantidade,
    valorUnitarioCentavos: reaisParaCentavos(
      item.valorUnitario,
      `itens[${indice}].valorUnitario`,
    ),
  }));
}

export function toOrcamentoCreateInput(request: OrcamentoCreateRequest): OrcamentoCreateInput {
  const itens = mapearItens(request.itens);
  return {
    nome: request.nome,
    telefone: request.telefone,
    placa: request.placa,
    valorCentavos: totalCentavosDosItens(itens),
    itens,
  };
}

export function toOrcamentoInput(request: OrcamentoUpdateRequest): OrcamentoInput {
  const itens = mapearItens(request.itens);
  return {
    nome: request.nome,
    telefone: request.telefone,
    placa: request.placa,
    decisao: request.decisao,
    valorCentavos: totalCentavosDosItens(itens),
    itens,
  };
}

export function toOrcamentoResponse(orcamento: Orcamento) {
  return {
    id: orcamento.id,
    nome: orcamento.nome,
    telefone: orcamento.telefone,
    placa: orcamento.placa,
    decisao: orcamento.decisao,
    decisaoData: orcamento.decisaoData,
    valor: orcamento.valorCentavos / 100,
    itens: orcamento.itens.map((item) => ({
      descricao: item.descricao,
      tipo: item.tipo,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitarioCentavos / 100,
    })),
  };
}

export function reaisParaCentavos(reais: number, campo: string): number {
  const centavos = Math.round(reais * 100);
  const diferenca = Math.abs(reais - centavos / 100);
  if (diferenca > Number.EPSILON * Math.max(1, Math.abs(reais)) * 10) {
    throw new ValidationError(`Campo '${campo}' deve ter no máximo duas casas decimais`);
  }
  return centavos;
}
