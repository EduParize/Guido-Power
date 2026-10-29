import { ConflictError, NotFoundError } from "../../domain/common/errors/app-error";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";
import { EDecisao } from "../../domain/orcamento/entity/e-decisao";
import { OrcamentoService } from "../../domain/orcamento/service/orcamento.service";
import {
  FakeOrcamentoRepository,
  FakeOrdemServicoRepository,
  ORCAMENTO_ID,
  orcamentoAprovadoSeed,
  orcamentoDominioInput,
  orcamentoGravacao,
  ordemDominioInput,
} from "../mocks/ordem-servico.fakes";

const VEICULO = "64a000000000000000000010";
const CLIENTE = "64a000000000000000000020";
const INEXISTENTE = "64f000000000000000000099";

function makeOrcamentoService() {
  const ordemRepo = new FakeOrdemServicoRepository();
  const orcamentoRepo = new FakeOrcamentoRepository();
  const service = new OrcamentoService(orcamentoRepo, orcamentoRepo, ordemRepo);
  return { service, orcamentoRepo, ordemRepo };
}

describe("OrcamentoService", () => {
  it("cria orçamento sempre PENDENTE e com total derivado", async () => {
    const { service } = makeOrcamentoService();
    const { decisao: _decisao, ...semDecisao } = orcamentoDominioInput;
    const criado = await service.create({
      ...semDecisao,
      valorCentavos: 1,
    });
    expect(criado.valorCentavos).toBe(16050);
    expect(criado.itens[0].valorUnitarioCentavos).toBe(8025);
    expect(criado.nome).toBeNull();
    expect(criado.telefone).toBeNull();
    expect(criado.placa).toBeNull();
    expect(criado.decisao).toBe(EDecisao.PENDENTE);
    expect(criado.decisaoData).toBeInstanceOf(Date);
  });

  it("cria orçamento com lead parcial ou completo", async () => {
    const { service } = makeOrcamentoService();
    const parcial = await service.create({
      ...orcamentoDominioInput,
      nome: "  João  ",
      telefone: null,
      placa: "abc1d23",
    });
    expect(parcial).toMatchObject({
      nome: "João",
      telefone: null,
      placa: "ABC1D23",
    });

    const completo = await service.create({
      ...orcamentoDominioInput,
      nome: "Maria",
      telefone: "54999999999",
      placa: "XYZ9H88",
    });
    expect(completo).toMatchObject({
      nome: "Maria",
      telefone: "54999999999",
      placa: "XYZ9H88",
    });
  });

  it("aprova e recusa orçamento atualizando decisaoData", async () => {
    const { service } = makeOrcamentoService();
    const criado = await service.create(orcamentoDominioInput);
    const dataPendente = criado.decisaoData;

    const aprovado = await service.update(criado.id, {
      ...orcamentoDominioInput,
      decisao: EDecisao.APROVADO,
    });
    expect(aprovado.decisao).toBe(EDecisao.APROVADO);
    expect(aprovado.decisaoData.getTime()).toBeGreaterThanOrEqual(dataPendente.getTime());

    const recusado = await service.update(criado.id, {
      ...orcamentoDominioInput,
      decisao: EDecisao.RECUSADO,
    });
    expect(recusado.decisao).toBe(EDecisao.RECUSADO);
    expect(recusado.decisaoData.getTime()).toBeGreaterThanOrEqual(aprovado.decisaoData.getTime());
  });

  it("atualiza e lista orçamentos; itens vazios zeram o total", async () => {
    const { service } = makeOrcamentoService();
    const criado = await service.create(orcamentoDominioInput);
    const atualizado = await service.update(criado.id, {
      ...orcamentoDominioInput,
      valorCentavos: 20000,
      itens: [],
    });
    expect(atualizado.valorCentavos).toBe(0);
    expect(await service.list()).toHaveLength(1);
  });

  it("404 para orçamento inexistente", async () => {
    const { service } = makeOrcamentoService();
    await expect(service.getById(INEXISTENTE)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.update(INEXISTENTE, orcamentoDominioInput)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.delete(INEXISTENTE)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("409 ao apagar orçamento vinculado ou alterar decisão para não aprovado", async () => {
    const { service, orcamentoRepo, ordemRepo } = makeOrcamentoService();
    orcamentoRepo.items.push(orcamentoAprovadoSeed(ORCAMENTO_ID, {
      nome: "Ana",
      telefone: "54999999999",
    }));

    const ordemService = new OrdemServicoService(
      ordemRepo,
      ordemRepo,
      { findById: jest.fn().mockResolvedValue({ id: VEICULO, dono: CLIENTE, marca: "Fiat", modelo: "Uno", placa: "ABC1D23" }) } as any,
      { findById: jest.fn().mockResolvedValue({ id: CLIENTE, nome: "Ana", telefone: "54999999999" }) } as any,
      { enviar: jest.fn() },
      orcamentoRepo,
    );
    await ordemService.create(ordemDominioInput(EStatus.EM_ESPERA, ORCAMENTO_ID));

    await expect(service.delete(ORCAMENTO_ID)).rejects.toBeInstanceOf(ConflictError);
    await expect(
      service.update(ORCAMENTO_ID, { ...orcamentoDominioInput, decisao: EDecisao.RECUSADO }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("apaga orçamento livre", async () => {
    const { service } = makeOrcamentoService();
    const criado = await service.create(orcamentoDominioInput);
    await service.delete(criado.id);
    await expect(service.getById(criado.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("gravação direta via fake aceita OrcamentoGravacao", async () => {
    const { orcamentoRepo } = makeOrcamentoService();
    const criado = await orcamentoRepo.create(orcamentoGravacao({ nome: "Lead" }));
    expect(criado.nome).toBe("Lead");
    expect(criado.decisao).toBe(EDecisao.PENDENTE);
  });
});
