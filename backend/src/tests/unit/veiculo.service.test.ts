import { FakeVeiculoRepository } from "../mocks/veiculo.fakes";
import { VeiculoService } from "../../domain/veiculo/service/veiculo.service";
import { AppError, NotFoundError, ValidationError } from "../../domain/common/errors/app-error";

const DONO = "64a000000000000000000001";
const base = { modelo: "Uno", ano: "2010", marca: "Fiat", placa: "ABC1234", dono: DONO };

function setup({ clienteExiste = true, temOrdem = false } = {}) {
  const repo = new FakeVeiculoRepository();
  const clienteRepo = { findById: jest.fn().mockResolvedValue(clienteExiste ? { id: DONO } : null) };
  const ordemRepo = { existsByVeiculoId: jest.fn().mockResolvedValue(temOrdem) };
  const service = new VeiculoService(repo, repo, clienteRepo as any, ordemRepo as any);
  return { service, repo };
}

describe("VeiculoService", () => {
  it("rejeita dono inexistente", async () => {
    const { service } = setup({ clienteExiste: false });
    await expect(service.create(base)).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejeita placa duplicada (409), mesmo com formatação diferente", async () => {
    const { service } = setup();
    await service.create(base);
    await expect(service.create({ ...base, placa: "abc-1234" })).rejects.toMatchObject({ statusCode: 409 });
  });

  it("permite atualizar mantendo a própria placa", async () => {
    const { service } = setup();
    const v = await service.create(base);
    await expect(service.update(v.id, { ...base, modelo: "Palio" })).resolves.toMatchObject({ modelo: "Palio" });
  });

  it("bloqueia delete com ordem vinculada (409)", async () => {
    const { service } = setup({ temOrdem: true });
    const v = await service.create(base);
    await expect(service.delete(v.id)).rejects.toBeInstanceOf(AppError);
    await expect(service.delete(v.id)).rejects.toMatchObject({ statusCode: 409 });
  });

  it("404 para id inexistente", async () => {
    const { service } = setup();
    await expect(service.getById("64b0000000000000000000ff")).rejects.toBeInstanceOf(NotFoundError);
  });
});