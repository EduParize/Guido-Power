import { Orcamento, OrcamentoInput } from "../../domain/orcamento/entity/orcamento.entity";

export const reaisParaCentavos = (reais: number): number => Math.round(reais * 100);
export const centavosParaReais = (centavos: number): number => centavos / 100;

export const toOrcamentoInput = (body: { valor: number }): OrcamentoInput => ({
  valorCentavos: reaisParaCentavos(body.valor),
});

export const toOrcamentoResponse = (o: Orcamento) => ({
  id: o.id,
  valor: centavosParaReais(o.valorCentavos),
});