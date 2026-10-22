export type Veiculo = {
  id: string;
  modelo: string;
  ano: string;
  marca: string;
  placa: string;
  dono: string; // id do cliente
};

export type VeiculoInput = Omit<Veiculo, "id">;