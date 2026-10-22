import { EDecisao } from "./e-decisao";
import { EStatus } from "./e-status";
import { ETipo } from "./e-tipo";

export type ItemOrdem = {
  descricao: string;
  tipo: ETipo;
  quantidade: number;
  valorUnitario: number;
};

export type EventoOrdem = {
  data: Date;
  status: EStatus;
  motivo: string | null;
};

export type OrdemServico = {
  id: string;
  veiculoId: string;
  clienteId: string;
  decisao: EDecisao;
  decisaoData: Date;
  descricao: string;
  orcamento: number;
  status: EStatus;
  historico: EventoOrdem[];
  itens: ItemOrdem[];
};

export type OrdemServicoGravacao = Omit<OrdemServico, "id">;

export type OrdemServicoInput = Omit<OrdemServicoGravacao, "decisaoData" | "historico"> & {
  motivo?: string;
};
