import { EStatus } from "./e-status";
import { Evento, EventoInput } from "./evento.entity";

export type OrdemServico = {
  id: string;
  veiculoId: string;
  clienteId: string;
  orcamentoId: string;
  descricao: string;
  status: EStatus;
  historico: Evento[];
  historicoVersao: number;
};

export type OrdemServicoCriacao = Omit<OrdemServico, "id" | "historico"> & {
  historico: EventoInput[];
};

export type OrdemServicoAtualizacao = Pick<
  OrdemServico,
  "veiculoId" | "clienteId" | "orcamentoId" | "descricao"
>;

export type OrdemServicoInput = Omit<
  OrdemServico,
  "id" | "historico" | "historicoVersao"
> & {
  motivo?: string;
};

export type OrdemServicoUpdateInput = Omit<OrdemServicoInput, "status" | "motivo">;
