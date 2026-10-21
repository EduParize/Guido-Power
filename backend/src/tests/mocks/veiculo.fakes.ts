import { Veiculo, VeiculoInput } from "../../domain/veiculo/entity/veiculo.entity";
import { VeiculoRepositoryRead } from "../../domain/veiculo/repository/veiculo.repository.read";
import { VeiculoRepositoryWrite } from "../../domain/veiculo/repository/veiculo.repository.write";

export class FakeVeiculoRepository
  implements VeiculoRepositoryRead, VeiculoRepositoryWrite
{
  items: Veiculo[] = [];
  private seq = 0;

  async findById(id: string) { return this.items.find((v) => v.id === id) ?? null; }
  async findByPlaca(p: string) { return this.items.find((v) => v.placa === p) ?? null; }
  async list() { return [...this.items]; }
  async listByClienteId(c: string) { return this.items.filter((v) => v.dono === c); }
  async existsByClienteId(c: string) { return this.items.some((v) => v.dono === c); }

  async create(data: VeiculoInput) {
    const v = { id: `64b0000000000000000000${String(++this.seq).padStart(2, "0")}`, ...data };
    this.items.push(v);
    return v;
  }
  async update(id: string, data: VeiculoInput) {
    const i = this.items.findIndex((v) => v.id === id);
    if (i < 0) return null;
    this.items[i] = { id, ...data };
    return this.items[i];
  }
  async delete(id: string) {
    const antes = this.items.length;
    this.items = this.items.filter((v) => v.id !== id);
    return this.items.length < antes;
  }
}