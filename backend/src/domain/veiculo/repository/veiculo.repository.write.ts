import { Veiculo, VeiculoInput } from "../entity/veiculo.entity";

export interface VeiculoRepositoryWrite {
  create(data: VeiculoInput): Promise<Veiculo>;
  update(id: string, data: VeiculoInput): Promise<Veiculo | null>;
  delete(id: string): Promise<boolean>;
}