import { EDecisao } from "./e-decisao";
import { EStatus } from "./e-status";
import { ETipo } from "./e-tipo";
import { Evento, EventoInput } from "./evento.entity";

export type ItemOrdem = {
  descricao: string;
  tipo: ETipo;
  quantidade: number;
  valorUnitarioCentavos: number;
};

export type OrdemServico = {
  id: string;
  veiculoId: string;
  clienteId: string;
  decisao: EDecisao;
  decisaoData: Date;
  descricao: string;
  orcamentoCentavos: number;
  status: EStatus;
  historico: Evento[];
  historicoVersao: number;
  itens: ItemOrdem[];
};

export type OrdemServicoCriacao = Omit<OrdemServico, "id" | "historico"> & {
  historico: EventoInput[];
};

export type OrdemServicoAtualizacao = Pick<
  OrdemServico,
  "veiculoId" | "clienteId" | "decisao" | "decisaoData" | "descricao" | "orcamentoCentavos" | "itens"
>;

export type OrdemServicoInput = Omit<
  OrdemServico,
  "id" | "decisaoData" | "historico" | "historicoVersao"
> & {
  motivo?: string;
};

export type OrdemServicoUpdateInput = Omit<OrdemServicoInput, "status" | "motivo">;
