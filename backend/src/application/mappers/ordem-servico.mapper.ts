import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import {
  OrdemServico,
  OrdemServicoInput,
  OrdemServicoUpdateInput,
} from "../../domain/ordem-servico/entity/ordem-servico.entity";

export type OrdemServicoBaseRequest = {
  veiculoId: string;
  clienteId: string;
  orcamentoId: string;
  descricao: string;
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
    orcamentoId: request.orcamentoId,
    descricao: request.descricao,
  };
}

export function toOrdemServicoResponse(ordem: OrdemServico) {
  const { historicoVersao: _historicoVersao, ...campos } = ordem;
  return campos;
}
