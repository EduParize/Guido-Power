import { EDecisao } from "../../domain/ordem-servico/entity/e-decisao";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { ETipo } from "../../domain/ordem-servico/entity/e-tipo";
import { OrdemServico, OrdemServicoAtualizacao, OrdemServicoCriacao } from "../../domain/ordem-servico/entity/ordem-servico.entity";
import { OrdemServicoRepositoryRead } from "../../domain/ordem-servico/repository/ordem-servico.repository.read";
import { OrdemServicoRepositoryWrite } from "../../domain/ordem-servico/repository/ordem-servico.repository.write";

export class FakeOrdemServicoRepository
  implements OrdemServicoRepositoryRead, OrdemServicoRepositoryWrite
{
  items: OrdemServico[] = [];
  private seq = 0;
  private seqEvento = 0;

  novoEventoId() {
    return `64e0000000000000000000${String(++this.seqEvento).padStart(2, "0")}`;
  }

  async findById(id: string) { return this.items.find((o) => o.id === id) ?? null; }
  async list() { return [...this.items]; }
  async existsByVeiculoId(veiculoId: string) {
    return this.items.some((o) => o.veiculoId === veiculoId);
  }

  async create(data: OrdemServicoCriacao) {
    const ordem: OrdemServico = {
      id: `64d0000000000000000000${String(++this.seq).padStart(2, "0")}`,
      ...data,
      historico: data.historico.map((e) => ({ id: this.novoEventoId(), ...e })),
    };
    this.items.push(ordem);
    return ordem;
  }

  async update(id: string, data: OrdemServicoAtualizacao) {
    const i = this.items.findIndex((o) => o.id === id);
    if (i < 0) return null;
    this.items[i] = { ...this.items[i], ...data };
    return this.items[i];
  }

  async delete(id: string) {
    const antes = this.items.length;
    this.items = this.items.filter((o) => o.id !== id);
    return this.items.length < antes;
  }
}

export const itemPeca = {
  descricao: "Pastilha",
  tipo: ETipo.PECA,
  quantidade: 2,
  valorUnitario: 80,
};

export function ordemInput(status: EStatus = EStatus.EM_ESPERA) {
  return {
    veiculoId: "64a000000000000000000010",
    clienteId: "64a000000000000000000020",
    decisao: EDecisao.PENDENTE,
    descricao: "Revisão",
    orcamento: 150.5,
    status,
    itens: [itemPeca],
  };
}

export function ordemUpdateInput() {
  const { status: _status, ...resto } = ordemInput();
  return resto;
}
