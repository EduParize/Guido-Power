import { EDecisao } from "./e-decisao";
import { EStatus } from "./e-status";
import { ETipo } from "./e-tipo";
import { Evento, EventoInput } from "./evento.entity";

export type ItemOrdem = {
  descricao: string;
  tipo: ETipo;
  quantidade: number;
  valorUnitario: number;
};

export type OrdemServico = {
  id: string;
  veiculoId: string;
  clienteId: string;
  decisao: EDecisao;
  decisaoData: Date;
  descricao: string;
  orcamento: number;
  // Reflete o último evento do histórico; só muda pelos eventos.
  status: EStatus;
  historico: Evento[];
  itens: ItemOrdem[];
};

export type OrdemServicoCriacao = Omit<OrdemServico, "id" | "historico"> & {
  historico: EventoInput[];
};

// O update da OS não mexe em status nem em historico.
export type OrdemServicoAtualizacao = Omit<OrdemServico, "id" | "status" | "historico">;

export type OrdemServicoInput = Omit<OrdemServico, "id" | "decisaoData" | "historico">;

export type OrdemServicoUpdateInput = Omit<OrdemServicoInput, "status">;
