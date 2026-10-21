import { Veiculo } from "../entity/veiculo.entity";

export interface VeiculoRepositoryRead {
  findById(id: string): Promise<Veiculo | null>;
  findByPlaca(placa: string): Promise<Veiculo | null>;
  list(): Promise<Veiculo[]>;
  listByClienteId(clienteId: string): Promise<Veiculo[]>;
  existsByClienteId(clienteId: string): Promise<boolean>; // usado na exclusão de cliente
}