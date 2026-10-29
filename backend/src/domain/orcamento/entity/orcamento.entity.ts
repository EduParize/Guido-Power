export type Orcamento = {
  id: string;
  valorCentavos: number; // inteiro, em centavos
};

export type OrcamentoInput = Omit<Orcamento, "id">;