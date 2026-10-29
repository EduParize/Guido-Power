import { ConflictError, NotFoundError, ValidationError } from "../../domain/common/errors/app-error";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { EStatusNotificacao } from "../../domain/ordem-servico/entity/evento.entity";
import { OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";
import { EDecisao } from "../../domain/orcamento/entity/e-decisao";
import {
  FakeOrcamentoRepository,
  FakeOrdemServicoRepository,
  ORCAMENTO_ID,
  orcamentoAprovadoSeed,
  orcamentoGravacao,
  ordemDominioInput,
  ordemDominioUpdateInput,
} from "../mocks/ordem-servico.fakes";

const VEICULO = "64a000000000000000000010";
const CLIENTE = "64a000000000000000000020";
const veiculoPadrao = { id: VEICULO, dono: CLIENTE, marca: "Fiat", modelo: "Uno", placa: "ABC1D23" };
const clientePadrao = { id: CLIENTE, nome: "Ana", telefone: "(54) 99999-9999" };

async function setup({
  veiculo = veiculoPadrao,
  cliente = clientePadrao,
  comOrcamento = true,
  orcamentoOverrides = {},
}: {
  veiculo?: { id: string; dono: string; marca?: string; modelo?: string; placa?: string } | null;
  cliente?: { id: string; nome?: string; telefone: string } | null;
  comOrcamento?: boolean;
  orcamentoOverrides?: Parameters<typeof orcamentoAprovadoSeed>[1];
} = {}) {
  const repo = new FakeOrdemServicoRepository();
  const orcamentoRepo = new FakeOrcamentoRepository();
  if (comOrcamento) {
    orcamentoRepo.items.push(orcamentoAprovadoSeed(ORCAMENTO_ID, orcamentoOverrides));
  }
  const whatsapp = { enviar: jest.fn().mockResolvedValue(undefined) };
  const service = new OrdemServicoService(
    repo,
    repo,
    { findById: jest.fn().mockResolvedValue(veiculo) } as any,
    { findById: jest.fn().mockResolvedValue(cliente) } as any,
    whatsapp,
    orcamentoRepo,
  );
  return { service, repo, orcamentoRepo, whatsapp };
}

describe("OrdemServicoService", () => {
  it("criar grava o status inicial como primeiro evento e não chama a Zenvia", async () => {
    const { service, whatsapp, orcamentoRepo } = await setup({
      orcamentoOverrides: { nome: "Lead", telefone: "54988887777", placa: null },
    });
    const ordem = await service.create(ordemDominioInput(EStatus.DIAGNOSTICO));
    expect(whatsapp.enviar).not.toHaveBeenCalled();
    expect(ordem.status).toBe(EStatus.DIAGNOSTICO);
    expect(ordem.orcamentoId).toBe(ORCAMENTO_ID);
    expect(ordem.historico).toHaveLength(1);
    expect(ordem.historico[0]).toMatchObject({
      id: expect.any(String),
      status: EStatus.DIAGNOSTICO,
      data: expect.any(Date),
      motivo: null,
      notificacao: { status: EStatusNotificacao.NAO_APLICAVEL },
    });
    expect(ordem).not.toHaveProperty("decisao");
    expect(ordem).not.toHaveProperty("decisaoData");
    const orcamento = await orcamentoRepo.findById(ORCAMENTO_ID);
    expect(orcamento).toMatchObject({
      nome: "Lead",
      telefone: "54988887777",
      decisao: EDecisao.APROVADO,
    });
  });

  it("criar pausado ou cancelado exige motivo", async () => {
    const { service } = await setup();
    await expect(
      service.create({ ...ordemDominioInput(EStatus.PAUSADO), motivo: undefined }),
    ).rejects.toBeInstanceOf(ValidationError);
    const ordem = await service.create(ordemDominioInput(EStatus.CANCELADO));
    expect(ordem.historico[0].motivo).toBe("Motivo informado");
    expect(ordem.historico[0].notificacao.status).toBe(EStatusNotificacao.NAO_APLICAVEL);
  });

  it("rejeita veículo inexistente, cliente inexistente e dono diferente", async () => {
    await expect((await setup({ veiculo: null })).service.create(ordemDominioInput())).rejects.toBeInstanceOf(ValidationError);
    await expect((await setup({ cliente: null })).service.create(ordemDominioInput())).rejects.toBeInstanceOf(ValidationError);
    await expect(
      (await setup({ veiculo: { id: VEICULO, dono: "64a000000000000000000099" } })).service.create(ordemDominioInput()),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejeita orçamento inexistente", async () => {
    const { service } = await setup({ comOrcamento: false });
    await expect(service.create(ordemDominioInput())).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejeita orçamento não aprovado", async () => {
    const { service, orcamentoRepo } = await setup({ comOrcamento: false });
    orcamentoRepo.items.push(orcamentoAprovadoSeed(ORCAMENTO_ID, { decisao: EDecisao.PENDENTE }));
    await expect(service.create(ordemDominioInput())).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejeita placa divergente quando orçamento tem placa; sem placa no orçamento ok", async () => {
    const { service: comPlaca } = await setup({
      orcamentoOverrides: { placa: "ZZZ9Z99" },
    });
    await expect(comPlaca.create(ordemDominioInput())).rejects.toBeInstanceOf(ValidationError);

    const { service: semPlaca } = await setup({
      orcamentoOverrides: { placa: null },
    });
    await expect(semPlaca.create(ordemDominioInput())).resolves.toMatchObject({ orcamentoId: ORCAMENTO_ID });
  });

  it("rejeita orçamento já vinculado a outra ordem", async () => {
    const { service, orcamentoRepo } = await setup();
    await service.create(ordemDominioInput());
    const segundo = await orcamentoRepo.create(orcamentoGravacao({
      decisao: EDecisao.APROVADO,
      valorCentavos: 1000,
      itens: [],
    }));
    await expect(
      service.create(ordemDominioInput(EStatus.EM_ESPERA, ORCAMENTO_ID)),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      service.create(ordemDominioInput(EStatus.EM_ESPERA, segundo.id)),
    ).resolves.toMatchObject({ orcamentoId: segundo.id });
  });

  it("update preserva status e histórico e não chama a Zenvia", async () => {
    const { service, whatsapp } = await setup();
    const ordem = await service.create(ordemDominioInput());
    const atualizada = await service.update(ordem.id, { ...ordemDominioUpdateInput(), descricao: "Revisão completa" });
    expect(whatsapp.enviar).not.toHaveBeenCalled();
    expect(atualizada.descricao).toBe("Revisão completa");
    expect(atualizada.status).toBe(EStatus.EM_ESPERA);
    expect(atualizada.historico).toEqual(ordem.historico);
  });

  it("apagar a ordem não remove o orçamento", async () => {
    const { service, orcamentoRepo } = await setup();
    const ordem = await service.create(ordemDominioInput());
    await service.delete(ordem.id);
    expect(await orcamentoRepo.findById(ORCAMENTO_ID)).not.toBeNull();
  });
});
