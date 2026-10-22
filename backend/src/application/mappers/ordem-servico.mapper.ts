import { ValidationError } from "../../domain/common/errors/app-error";
import { EDecisao } from "../../domain/ordem-servico/entity/e-decisao";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { ETipo } from "../../domain/ordem-servico/entity/e-tipo";
import {
  OrdemServico,
  OrdemServicoInput,
  OrdemServicoUpdateInput,
} from "../../domain/ordem-servico/entity/ordem-servico.entity";

export type ItemOrdemRequest = {
  descricao: string;
  tipo: ETipo;
  quantidade: number;
  valorUnitario: number;
};

export type OrdemServicoBaseRequest = {
  veiculoId: string;
  clienteId: string;
  decisao: EDecisao;
  descricao: string;
  orcamento: number;
  itens: ItemOrdemRequest[];
};

export type OrdemServicoCreateRequest = OrdemServicoBaseRequest & {
  status: EStatus;
  motivo?: string;
};

export function toOrdemServicoInput(request: OrdemServicoCreateRequest): OrdemServicoInput {
  return {
    ...toCamposGravacao(request),
    status: request.status,
    motivo: request.motivo,
  };
}

export function toOrdemServicoUpdateInput(
  request: OrdemServicoBaseRequest,
): OrdemServicoUpdateInput {
  return toCamposGravacao(request);
}

function toCamposGravacao(request: OrdemServicoBaseRequest): OrdemServicoUpdateInput {
  return {
    veiculoId: request.veiculoId,
    clienteId: request.clienteId,
    decisao: request.decisao,
    descricao: request.descricao,
    orcamentoCentavos: reaisParaCentavos(request.orcamento, "orcamento"),
    itens: request.itens.map((item, indice) => ({
      descricao: item.descricao,
      tipo: item.tipo,
      quantidade: item.quantidade,
      valorUnitarioCentavos: reaisParaCentavos(
        item.valorUnitario,
        `itens[${indice}].valorUnitario`,
      ),
    })),
  };
}

export function toOrdemServicoResponse(ordem: OrdemServico) {
  const {
    orcamentoCentavos,
    historicoVersao: _historicoVersao,
    itens,
    ...campos
  } = ordem;
  return {
    ...campos,
    orcamento: orcamentoCentavos / 100,
    itens: itens.map((item) => ({
      descricao: item.descricao,
      tipo: item.tipo,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitarioCentavos / 100,
    })),
  };
}

function reaisParaCentavos(reais: number, campo: string): number {
  const centavos = Math.round(reais * 100);
  const diferenca = Math.abs(reais - centavos / 100);
  if (diferenca > Number.EPSILON * Math.max(1, Math.abs(reais)) * 10) {
    throw new ValidationError(`Campo '${campo}' deve ter no máximo duas casas decimais`);
  }
  return centavos;
}
