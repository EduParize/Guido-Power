import { FakeClienteRepository } from "../mocks/cliente.fakes";
import { ClienteService } from "../../domain/cliente/service/cliente.service";
import { AppError, NotFoundError } from "../../domain/common/errors/app-error";

const base = { nome: "Ana", documento: "12345678900", email: "ana@email.com", telefone: "54999999999" };

function setup({ temVeiculo = false } = {}) {
  const repo = new FakeClienteRepository();
  const veiculoRepo = { existsByClienteId: jest.fn().mockResolvedValue(temVeiculo) };
  const service = new ClienteService(repo, repo, veiculoRepo as any);
  return { service, repo };
}

describe("ClienteService", () => {
  it("rejeita e-mail duplicado (409)", async () => {
    const { service } = setup();
    await service.create(base);
    await expect(
      service.create({ ...base, documento: "00000000000" }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("rejeita documento duplicado (409)", async () => {
    const { service } = setup();
    await service.create(base);
    await expect(
      service.create({ ...base, email: "outro@email.com" }),
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      service.create({ ...base, email: "outro@email.com" }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("permite atualizar mantendo o próprio e-mail e documento", async () => {
    const { service } = setup();
    const cliente = await service.create(base);
    await expect(
      service.update(cliente.id, { ...base, nome: "Ana Souza" }),
    ).resolves.toMatchObject({ nome: "Ana Souza" });
  });

  it("bloqueia delete com veículo vinculado (409)", async () => {
    const { service } = setup({ temVeiculo: true });
    const cliente = await service.create(base);
    await expect(service.delete(cliente.id)).rejects.toBeInstanceOf(AppError);
    await expect(service.delete(cliente.id)).rejects.toMatchObject({ statusCode: 409 });
  });

  it("404 para id inexistente", async () => {
    const { service } = setup();
    await expect(service.getById("64b0000000000000000000ff")).rejects.toBeInstanceOf(NotFoundError);
  });
});
