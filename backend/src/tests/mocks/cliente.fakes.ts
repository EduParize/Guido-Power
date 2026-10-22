import { Cliente, ClienteInput } from "../../domain/cliente/entity/cliente.entity";
import { ClienteRepositoryRead } from "../../domain/cliente/repository/cliente.repository.read";
import { ClienteRepositoryWrite } from "../../domain/cliente/repository/cliente.repository.write";

export class FakeClienteRepository
  implements ClienteRepositoryRead, ClienteRepositoryWrite
{
  items: Cliente[] = [];
  private seq = 0;

  async findById(id: string) { return this.items.find((c) => c.id === id) ?? null; }
  async list() { return [...this.items]; }
  async findByEmail(email: string) { return this.items.find((c) => c.email === email) ?? null; }
  async findByDocumento(documento: string) {
    return this.items.find((c) => c.documento === documento) ?? null;
  }

  async create(data: ClienteInput) {
    const cliente = {
      id: `64c0000000000000000000${String(++this.seq).padStart(2, "0")}`,
      ...data,
    };
    this.items.push(cliente);
    return cliente;
  }

  async update(id: string, data: ClienteInput) {
    const i = this.items.findIndex((c) => c.id === id);
    if (i < 0) return null;
    this.items[i] = { id, ...data };
    return this.items[i];
  }

  async delete(id: string) {
    const antes = this.items.length;
    this.items = this.items.filter((c) => c.id !== id);
    return this.items.length < antes;
  }
}
