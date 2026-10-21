export interface OrdemServicoRepositoryRead {
  existsByVeiculoId(veiculoId: string): Promise<boolean>;
}