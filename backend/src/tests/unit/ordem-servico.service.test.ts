import { ValidationError } from "../../domain/common/errors/app-error";
import { EDecisao } from "../../domain/ordem-servico/entity/e-decisao";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { EStatusNotificacao } from "../../domain/ordem-servico/entity/evento.entity";
import { OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";
import {
  FakeOrdemServicoRepository,
  ordemDominioInput,
  ordemDominioUpdateInput,
} from "../mocks/ordem-servico.fakes";

const VEICULO = "64a000000000000000000010";
const CLIENTE = "64a000000000000000000020";
const veiculoPadrao = { id: VEICULO, dono: CLIENTE, marca: "Fiat", modelo: "Uno", placa: "ABC1D23" };
const clientePadrao = { id: CLIENTE, nome: "Ana", telefone: "(54) 99999-9999" };

function setup({
  veiculo = veiculoPadrao,
  cliente = clientePadrao,
}: {
  veiculo?: { id: string; dono: string; marca?: string; modelo?: string; placa?: string } | null;
  cliente?: { id: string; nome?: string; telefone: string } | null;
} = {}) {
  const repo = new FakeOrdemServicoRepository();
  const whatsapp = { enviar: jest.fn().mockResolvedValue(undefined) };
  const service = new OrdemServicoService(
    repo,
    repo,
    { findById: jest.fn().mockResolvedValue(veiculo) } as any,
    { findById: jest.fn().mockResolvedValue(cliente) } as any,
    whatsapp,
  );
  return { service, repo, whatsapp };
}

describe("OrdemServicoService", () => {
  it("criar grava o status inicial como primeiro evento e não chama a Zenvia", async () => {
    const { service, whatsapp } = setup();
    const ordem = await service.create(ordemDominioInput(EStatus.DIAGNOSTICO));
    expect(whatsapp.enviar).not.toHaveBeenCalled();
    expect(ordem.status).toBe(EStatus.DIAGNOSTICO);
    expect(ordem.historico).toHaveLength(1);
    expect(ordem.historico[0]).toMatchObject({
      id: expect.any(String),
      status: EStatus.DIAGNOSTICO,
      data: expect.any(Date),
      motivo: null,
      notificacao: { status: EStatusNotificacao.NAO_APLICAVEL },
    });
    expect(ordem.orcamentoCentavos).toBe(15050);
    expect(ordem.itens[0].valorUnitarioCentavos).toBe(8025);
    expect(ordem.decisaoData).toBeInstanceOf(Date);
  });

  it("criar pausado ou cancelado exige motivo", async () => {
    const { service } = setup();
    await expect(
      service.create({ ...ordemDominioInput(EStatus.PAUSADO), motivo: undefined }),
    ).rejects.toBeInstanceOf(ValidationError);
    const ordem = await service.create(ordemDominioInput(EStatus.CANCELADO));
    expect(ordem.historico[0].motivo).toBe("Motivo informado");
    expect(ordem.historico[0].notificacao.status).toBe(EStatusNotificacao.NAO_APLICAVEL);
  });

  it("rejeita veículo inexistente, cliente inexistente e dono diferente", async () => {
    await expect(setup({ veiculo: null }).service.create(ordemDominioInput())).rejects.toBeInstanceOf(ValidationError);
    await expect(setup({ cliente: null }).service.create(ordemDominioInput())).rejects.toBeInstanceOf(ValidationError);
    await expect(
      setup({ veiculo: { id: VEICULO, dono: "64a000000000000000000099" } }).service.create(ordemDominioInput()),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("update preserva status e histórico e não chama a Zenvia", async () => {
    const { service, whatsapp } = setup();
    const ordem = await service.create(ordemDominioInput());
    const atualizada = await service.update(ordem.id, { ...ordemDominioUpdateInput(), descricao: "Revisão completa" });
    expect(whatsapp.enviar).not.toHaveBeenCalled();
    expect(atualizada.descricao).toBe("Revisão completa");
    expect(atualizada.status).toBe(EStatus.EM_ESPERA);
    expect(atualizada.historico).toEqual(ordem.historico);
  });

  it("mudar só a decisão atualiza decisaoData", async () => {
    const { service } = setup();
    const ordem = await service.create(ordemDominioInput());
    const atualizada = await service.update(ordem.id, { ...ordemDominioUpdateInput(), decisao: EDecisao.APROVADO });
    expect(atualizada.decisao).toBe(EDecisao.APROVADO);
    expect(atualizada.decisaoData.getTime()).toBeGreaterThanOrEqual(ordem.decisaoData.getTime());
  });
});
