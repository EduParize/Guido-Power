export interface Veiculo {
  id: string
  modelo: string
  ano: string
  marca: string
  placa: string
  dono: string
}

export type VeiculoInput = Omit<Veiculo, 'id'>
