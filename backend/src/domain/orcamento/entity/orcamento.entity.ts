import { EDecisao } from "./e-decisao";
import { ETipo } from "./e-tipo";

export type ItemOrcamento = {
  descricao: string;
  tipo: ETipo;
  quantidade: number;
  valorUnitarioCentavos: number;
};

export function totalCentavosDosItens(itens: ItemOrcamento[]): number {
  return itens.reduce(
    (soma, item) => soma + item.quantidade * item.valorUnitarioCentavos,
    0,
  );
}

export type Orcamento = {
  id: string;
  nome: string | null;
  telefone: string | null;
  placa: string | null;
  decisao: EDecisao;
  decisaoData: Date;
  valorCentavos: number;
  itens: ItemOrcamento[];
};

/** Dados de entrada da API/aplicação (sem id nem decisaoData). */
export type OrcamentoInput = {
  nome: string | null;
  telefone: string | null;
  placa: string | null;
  decisao: EDecisao;
  valorCentavos: number;
  itens: ItemOrcamento[];
};

/** Entrada de criação: decisão é sempre PENDENTE no service. */
export type OrcamentoCreateInput = Omit<OrcamentoInput, "decisao">;

/** Payload completo para persistência. */
export type OrcamentoGravacao = Omit<Orcamento, "id">;
