import { ValidationError } from "../../domain/common/errors/app-error";
import { EDecisao } from "../../domain/ordem-servico/entity/e-decisao";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { TemplateWhatsapp } from "../../domain/ordem-servico/entity/template-whatsapp";
import { OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";
import { FakeOrdemServicoRepository, ordemInput } from "../mocks/ordem-servico.fakes";

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
  it("criar não chama a Zenvia e começa com histórico vazio", async () => {
    const { service, whatsapp } = setup();
    const ordem = await service.create(ordemInput());
    expect(whatsapp.enviar).not.toHaveBeenCalled();
    expect(ordem.historico).toEqual([]);
    expect(ordem.orcamento).toBe(15050);
    expect(ordem.decisaoData).toBeInstanceOf(Date);
  });

  it("rejeita veículo inexistente, cliente inexistente e dono diferente", async () => {
    await expect(setup({ veiculo: null }).service.create(ordemInput())).rejects.toBeInstanceOf(ValidationError);
    await expect(setup({ cliente: null }).service.create(ordemInput())).rejects.toBeInstanceOf(ValidationError);
    await expect(
      setup({ veiculo: { id: VEICULO, dono: "64a000000000000000000099" } }).service.create(ordemInput()),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("PUT com status novo envia o template e grava o evento", async () => {
    const { service, whatsapp } = setup();
    const ordem = await service.create(ordemInput());
    const atualizada = await service.update(ordem.id, ordemInput(EStatus.INICIADO));
    expect(whatsapp.enviar).toHaveBeenCalledWith(expect.objectContaining({
      para: "54999999999",
      template: TemplateWhatsapp.ServicoIniciado,
      campos: expect.objectContaining({
        nomeCliente: "Ana",
        veiculo: "Fiat Uno ABC1D23",
        status: EStatus.INICIADO,
      }),
    }));
    expect(whatsapp.enviar.mock.calls[0][0].campos.motivo).toBeUndefined();
    expect(atualizada.historico).toHaveLength(1);
    expect(atualizada.historico[0].status).toBe(EStatus.INICIADO);
    expect(atualizada.historico[0].motivo).toBeNull();
  });

  it("pausado envia o motivo e sem motivo é rejeitado", async () => {
    const { service, whatsapp, repo } = setup();
    const ordem = await service.create(ordemInput());
    await expect(service.update(ordem.id, ordemInput(EStatus.PAUSADO))).rejects.toBeInstanceOf(ValidationError);
    expect(whatsapp.enviar).not.toHaveBeenCalled();
    expect(repo.items[0].status).toBe(EStatus.AGUARDANDO_INICIO);

    await service.update(ordem.id, { ...ordemInput(EStatus.PAUSADO), motivo: "Aguardando peça" });
    expect(whatsapp.enviar).toHaveBeenCalledWith(expect.objectContaining({
      para: "54999999999",
      template: TemplateWhatsapp.ServicoPausado,
      campos: expect.objectContaining({
        nomeCliente: "Ana",
        veiculo: "Fiat Uno ABC1D23",
        status: EStatus.PAUSADO,
        motivo: "Aguardando peça",
      }),
    }));
  });

  it("cancelado envia o template e exige motivo", async () => {
    const { service, whatsapp } = setup();
    const ordem = await service.create(ordemInput());
    await expect(service.update(ordem.id, ordemInput(EStatus.CANCELADO))).rejects.toBeInstanceOf(ValidationError);
    const atualizada = await service.update(ordem.id, {
      ...ordemInput(EStatus.CANCELADO),
      motivo: "Cliente desistiu",
    });
    expect(whatsapp.enviar).toHaveBeenCalledWith(expect.objectContaining({
      para: "54999999999",
      template: TemplateWhatsapp.ServicoCancelado,
      campos: expect.objectContaining({
        nomeCliente: "Ana",
        veiculo: "Fiat Uno ABC1D23",
        status: EStatus.CANCELADO,
        motivo: "Cliente desistiu",
      }),
    }));
    expect(atualizada.status).toBe(EStatus.CANCELADO);
    expect(atualizada.historico[0].motivo).toBe("Cliente desistiu");
  });

  it("o mesmo status não reenvia nem duplica o histórico", async () => {
    const { service, whatsapp } = setup();
    const ordem = await service.create(ordemInput());
    await service.update(ordem.id, { ...ordemInput(), descricao: "Revisão completa" });
    expect(whatsapp.enviar).not.toHaveBeenCalled();
    expect((await service.getById(ordem.id)).historico).toEqual([]);
  });

  it("mudar só a decisão não chama a Zenvia e atualiza decisaoData", async () => {
    const { service, whatsapp } = setup();
    const ordem = await service.create(ordemInput());
    const atualizada = await service.update(ordem.id, { ...ordemInput(), decisao: EDecisao.APROVADO });
    expect(whatsapp.enviar).not.toHaveBeenCalled();
    expect(atualizada.decisaoData.getTime()).toBeGreaterThanOrEqual(ordem.decisaoData.getTime());
  });

  it("telefone sem dígitos impede o envio e não grava o status", async () => {
    const { service, repo } = setup({ cliente: { id: CLIENTE, telefone: "---" } });
    const ordem = await service.create(ordemInput());
    await expect(
      service.update(ordem.id, { ...ordemInput(EStatus.FINALIZADO), motivo: "Entregue" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(repo.items[0].status).toBe(EStatus.AGUARDANDO_INICIO);
  });
});
