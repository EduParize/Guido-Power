import { EDecisao } from "../../domain/ordem-servico/entity/e-decisao";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { ETipo } from "../../domain/ordem-servico/entity/e-tipo";
import { Evento, EventoAtualizacao, EventoInput } from "../../domain/ordem-servico/entity/evento.entity";
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

  async listEventos(ordemId: string) {
    const ordem = this.items.find((o) => o.id === ordemId);
    return ordem ? [...ordem.historico] : null;
  }

  async findEventoById(ordemId: string, eventoId: string) {
    const ordem = this.items.find((o) => o.id === ordemId);
    return ordem?.historico.find((e) => e.id === eventoId) ?? null;
  }

  async addEvento(ordemId: string, evento: EventoInput, statusOrdem?: EStatus) {
    const ordem = this.items.find((o) => o.id === ordemId);
    if (!ordem) return null;
    const novo: Evento = { id: this.novoEventoId(), ...evento };
    ordem.historico = [...ordem.historico, novo];
    if (statusOrdem) ordem.status = statusOrdem;
    return novo;
  }

  async updateEvento(ordemId: string, eventoId: string, dados: EventoAtualizacao, statusOrdem?: EStatus) {
    const ordem = this.items.find((o) => o.id === ordemId);
    const indice = ordem ? ordem.historico.findIndex((e) => e.id === eventoId) : -1;
    if (!ordem || indice < 0) return null;
    const atualizado = { ...ordem.historico[indice], ...dados };
    ordem.historico = ordem.historico.map((e, i) => (i === indice ? atualizado : e));
    if (statusOrdem) ordem.status = statusOrdem;
    return atualizado;
  }

  async removeEvento(ordemId: string, eventoId: string, statusOrdem?: EStatus) {
    const ordem = this.items.find((o) => o.id === ordemId);
    if (!ordem || !ordem.historico.some((e) => e.id === eventoId)) return false;
    ordem.historico = ordem.historico.filter((e) => e.id !== eventoId);
    if (statusOrdem) ordem.status = statusOrdem;
    return true;
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
