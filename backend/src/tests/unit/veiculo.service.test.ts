import { FakeVeiculoRepository } from "../mocks/veiculo.fakes";
import { VeiculoService } from "../../domain/veiculo/service/veiculo.service";
import { AppError, NotFoundError, ValidationError } from "../../domain/common/errors/app-error";
import { FakeOrcamentoRepository, orcamentoAprovadoSeed } from "../mocks/ordem-servico.fakes";

const DONO = "64a000000000000000000001";
const base = { modelo: "Uno", ano: "2010", marca: "Fiat", placa: "ABC1234", dono: DONO };

function setup({ clienteExiste = true, temOrdem = false } = {}) {
  const repo = new FakeVeiculoRepository();
  const orcamentoRepo = new FakeOrcamentoRepository();
  const clienteRepo = { findById: jest.fn().mockResolvedValue(clienteExiste ? { id: DONO } : null) };
  const ordemRepo = { existsByVeiculoId: jest.fn().mockResolvedValue(temOrdem) };
  const service = new VeiculoService(repo, repo, clienteRepo as any, ordemRepo as any, orcamentoRepo);
  return { service, repo, orcamentoRepo };
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

  it("createFromOrcamento exige placa no orçamento", async () => {
    const { service, orcamentoRepo } = setup();
    orcamentoRepo.items.push(orcamentoAprovadoSeed("64f000000000000000000030", { placa: null }));
    await expect(
      service.createFromOrcamento({
        orcamentoId: "64f000000000000000000030",
        dono: DONO,
        marca: "Fiat",
        modelo: "Uno",
        ano: "2010",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("createFromOrcamento reaproveita placa do orçamento", async () => {
    const { service, orcamentoRepo } = setup();
    orcamentoRepo.items.push(orcamentoAprovadoSeed("64f000000000000000000031", { placa: "xyz9h88" }));
    const veiculo = await service.createFromOrcamento({
      orcamentoId: "64f000000000000000000031",
      dono: DONO,
      marca: "VW",
      modelo: "Gol",
      ano: "2018",
    });
    expect(veiculo).toMatchObject({
      placa: "XYZ9H88",
      dono: DONO,
      marca: "VW",
      modelo: "Gol",
      ano: "2018",
    });
  });

  it("createFromOrcamento com placa já existente retorna 409", async () => {
    const { service, orcamentoRepo } = setup();
    await service.create(base);
    orcamentoRepo.items.push(orcamentoAprovadoSeed("64f000000000000000000032", { placa: "ABC1234" }));
    await expect(
      service.createFromOrcamento({
        orcamentoId: "64f000000000000000000032",
        dono: DONO,
        marca: "Fiat",
        modelo: "Uno",
        ano: "2010",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});
