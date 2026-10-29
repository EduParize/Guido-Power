import {
  ConflictError,
  NotificationError,
  NotFoundError,
  ValidationError,
} from "../../domain/common/errors/app-error";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import {
  EResultadoEnvio,
  EStatusNotificacao,
} from "../../domain/ordem-servico/entity/evento.entity";
import { TemplateWhatsapp } from "../../domain/ordem-servico/entity/template-whatsapp";
import { WhatsappTemplateError } from "../../domain/ordem-servico/gateway/whatsapp-template.gateway";
import { OrdemServicoService } from "../../domain/ordem-servico/service/ordem-servico.service";
import {
  FakeOrcamentoRepository,
  FakeOrdemServicoRepository,
  ORCAMENTO_ID,
  orcamentoAprovadoSeed,
  ordemDominioInput,
} from "../mocks/ordem-servico.fakes";

const VEICULO = "64a000000000000000000010";
const CLIENTE = "64a000000000000000000020";
const INEXISTENTE = "64d000000000000000000099";
const EVENTO_INEXISTENTE = "64e000000000000000000099";

// telefone null simula cliente antigo sem telefone gravado
async function setup(telefone: string | null = "(54) 99999-9999") {
  const repo = new FakeOrdemServicoRepository();
  const orcamentoRepo = new FakeOrcamentoRepository();
  orcamentoRepo.items.push(orcamentoAprovadoSeed());
  const whatsapp = { enviar: jest.fn().mockResolvedValue(undefined) };
  const service = new OrdemServicoService(
    repo,
    repo,
    { findById: jest.fn().mockResolvedValue({ id: VEICULO, dono: CLIENTE, marca: "Fiat", modelo: "Uno", placa: "ABC1D23" }) } as any,
    { findById: jest.fn().mockResolvedValue({ id: CLIENTE, nome: "Ana", telefone: telefone ?? undefined }) } as any,
    whatsapp,
    orcamentoRepo,
  );
  return { service, repo, whatsapp };
}

async function comOrdem(telefone?: string | null) {
  const ctx = await setup(telefone);
  const ordem = await ctx.service.create(ordemDominioInput(EStatus.EM_ESPERA));
  return { ...ctx, ordem, primeiro: ordem.historico[0] };
}

describe("OrdemServicoService - eventos", () => {
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => consoleError.mockRestore());

  it("ordem inexistente gera NotFoundError em list/get/add/update/remove", async () => {
    const { service } = await setup();
    await expect(service.listEventos(INEXISTENTE)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.getEvento(INEXISTENTE, EVENTO_INEXISTENTE)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.addEvento(INEXISTENTE, { status: EStatus.DIAGNOSTICO })).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      service.updateEvento(INEXISTENTE, EVENTO_INEXISTENTE, { status: EStatus.DIAGNOSTICO }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.removeEvento(INEXISTENTE, EVENTO_INEXISTENTE)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lista e busca eventos da ordem", async () => {
    const { service, ordem, primeiro } = await comOrdem();
    expect(await service.listEventos(ordem.id)).toEqual([primeiro]);
    expect(await service.getEvento(ordem.id, primeiro.id)).toEqual(primeiro);
    await expect(service.getEvento(ordem.id, EVENTO_INEXISTENTE)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("status inválido e data inválida geram ValidationError", async () => {
    const { service, ordem, primeiro } = await comOrdem();
    await expect(service.addEvento(ordem.id, { status: "Aberto" as EStatus })).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.addEvento(ordem.id, { status: EStatus.DIAGNOSTICO, data: new Date("xx") }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(service.updateEvento(ordem.id, primeiro.id, { status: "X" as EStatus })).rejects.toBeInstanceOf(ValidationError);
    await expect(service.updateEvento(ordem.id, primeiro.id, {})).rejects.toBeInstanceOf(ValidationError);
  });

  it("add sem data usa a data atual e com data usa a informada", async () => {
    const { service, ordem } = await comOrdem();
    const antes = Date.now();
    const semData = await service.addEvento(ordem.id, { status: EStatus.DIAGNOSTICO });
    expect(semData.data.getTime()).toBeGreaterThanOrEqual(antes);
    expect(semData.data.getTime()).toBeLessThanOrEqual(Date.now());

    const data = new Date("2026-10-20T13:00:00.000Z");
    const comData = await service.addEvento(ordem.id, { status: EStatus.EM_SERVICO, data });
    expect(comData.data).toEqual(data);
  });

  it("update e delete de evento inexistente geram NotFoundError", async () => {
    const { service, ordem } = await comOrdem();
    await expect(
      service.updateEvento(ordem.id, EVENTO_INEXISTENTE, { status: EStatus.FINALIZADO }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.removeEvento(ordem.id, EVENTO_INEXISTENTE)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("status da OS acompanha o último evento no add, update e remove", async () => {
    const { service, ordem, primeiro } = await comOrdem();
    const status = async () => (await service.getById(ordem.id)).status;

    const diagnostico = await service.addEvento(ordem.id, { status: EStatus.DIAGNOSTICO });
    expect(await status()).toBe(EStatus.DIAGNOSTICO);

    // editar um evento que não é o último não muda o status da OS
    await service.updateEvento(ordem.id, primeiro.id, { status: EStatus.AGUARDANDO_PECA });
    expect(await status()).toBe(EStatus.DIAGNOSTICO);

    await service.updateEvento(ordem.id, diagnostico.id, { status: EStatus.EM_SERVICO });
    expect(await status()).toBe(EStatus.EM_SERVICO);

    // remover o último volta ao status do anterior
    await service.removeEvento(ordem.id, diagnostico.id);
    expect(await status()).toBe(EStatus.AGUARDANDO_PECA);

    await expect(service.removeEvento(ordem.id, primeiro.id)).rejects.toBeInstanceOf(ConflictError);
    expect(await service.listEventos(ordem.id)).toHaveLength(1);
    expect(await status()).toBe(EStatus.AGUARDANDO_PECA);
  });

  it("add envia o WhatsApp com o template do status", async () => {
    const { service, ordem, whatsapp } = await comOrdem();
    const data = new Date("2026-10-20T13:00:00.000Z");
    await service.addEvento(ordem.id, { status: EStatus.AGUARDANDO_PECA, data });
    expect(whatsapp.enviar).toHaveBeenCalledWith({
      para: "5554999999999",
      template: TemplateWhatsapp.AguardandoPeca,
      campos: {
        nomeCliente: "Ana",
        veiculo: "Fiat Uno ABC1D23",
        data: "20/10/2026, 10:00",
        status: EStatus.AGUARDANDO_PECA,
      },
    });
  });

  it("update do status do último evento notifica; outros casos não", async () => {
    const { service, ordem, primeiro, whatsapp } = await comOrdem();
    const ultimo = await service.addEvento(ordem.id, { status: EStatus.DIAGNOSTICO });
    whatsapp.enviar.mockClear();

    await service.updateEvento(ordem.id, primeiro.id, { status: EStatus.EM_SERVICO });
    await service.updateEvento(ordem.id, ultimo.id, { data: new Date() });
    await service.updateEvento(ordem.id, ultimo.id, { status: EStatus.DIAGNOSTICO });
    expect(whatsapp.enviar).not.toHaveBeenCalled();

    await service.updateEvento(ordem.id, ultimo.id, { status: EStatus.FINALIZADO });
    expect(whatsapp.enviar).toHaveBeenCalledTimes(1);
    expect(whatsapp.enviar.mock.calls[0][0].template).toBe(TemplateWhatsapp.Finalizado);
  });

  it("falha da Zenvia mantém o evento, registra falha e retorna erro", async () => {
    const { service, ordem, whatsapp } = await comOrdem();
    whatsapp.enviar.mockRejectedValueOnce(new Error("Zenvia fora"));
    await expect(
      service.addEvento(ordem.id, { status: EStatus.FINALIZADO }),
    ).rejects.toMatchObject({
      details: {
        eventoId: expect.any(String),
        resultadoEnvio: EResultadoEnvio.INCERTO,
      },
    });
    const evento = (await service.listEventos(ordem.id))[1];
    expect(evento.notificacao.status).toBe(EStatusNotificacao.FALHA);
    expect((await service.getById(ordem.id)).status).toBe(EStatus.FINALIZADO);
    expect(consoleError).toHaveBeenCalled();
  });

  it("cliente sem telefone registra falha e informa o usuário", async () => {
    const { service, ordem, whatsapp } = await comOrdem(null);
    await expect(
      service.addEvento(ordem.id, { status: EStatus.DIAGNOSTICO }),
    ).rejects.toBeInstanceOf(NotificationError);
    expect(whatsapp.enviar).not.toHaveBeenCalled();
    const evento = (await service.listEventos(ordem.id))[1];
    expect(evento.notificacao.status).toBe(EStatusNotificacao.FALHA);
    expect(evento.notificacao.resultadoEnvio).toBe(EResultadoEnvio.REJEITADO);
  });

  it("telefone inválido não envia, mas mantém o evento falho", async () => {
    const { service, ordem, whatsapp } = await comOrdem("---");
    await expect(
      service.addEvento(ordem.id, { status: EStatus.DIAGNOSTICO }),
    ).rejects.toBeInstanceOf(NotificationError);
    expect(whatsapp.enviar).not.toHaveBeenCalled();
    const evento = (await service.listEventos(ordem.id))[1];
    expect(evento.notificacao.status).toBe(EStatusNotificacao.FALHA);
  });

  it("falha rejeitada pela Zenvia registra REJEITADO", async () => {
    const { service, ordem, whatsapp } = await comOrdem();
    whatsapp.enviar.mockRejectedValueOnce(
      new WhatsappTemplateError("Mensagem rejeitada pela Zenvia", EResultadoEnvio.REJEITADO),
    );
    await expect(
      service.addEvento(ordem.id, { status: EStatus.DIAGNOSTICO }),
    ).rejects.toMatchObject({
      details: { resultadoEnvio: EResultadoEnvio.REJEITADO },
    });
    const evento = (await service.listEventos(ordem.id))[1];
    expect(evento.notificacao.status).toBe(EStatusNotificacao.FALHA);
    expect(evento.notificacao.resultadoEnvio).toBe(EResultadoEnvio.REJEITADO);
  });

  it("reenvia evento falho sem duplicá-lo", async () => {
    const { service, ordem, whatsapp } = await comOrdem();
    whatsapp.enviar.mockRejectedValueOnce(new Error("Zenvia fora"));
    await expect(
      service.addEvento(ordem.id, { status: EStatus.DIAGNOSTICO }),
    ).rejects.toBeInstanceOf(NotificationError);
    const falho = (await service.listEventos(ordem.id))[1];

    const reenviado = await service.reenviarNotificacao(ordem.id, falho.id);

    expect(reenviado.notificacao.status).toBe(EStatusNotificacao.ENVIADA);
    expect(await service.listEventos(ordem.id)).toHaveLength(2);
    expect(whatsapp.enviar).toHaveBeenCalledTimes(2);
  });

  it("rejeita status repetido e exige motivo em pausa e cancelamento", async () => {
    const { service, ordem } = await comOrdem();
    await expect(
      service.addEvento(ordem.id, { status: EStatus.EM_ESPERA }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      service.addEvento(ordem.id, { status: EStatus.PAUSADO }),
    ).rejects.toBeInstanceOf(ValidationError);

    const pausado = await service.addEvento(ordem.id, {
      status: EStatus.PAUSADO,
      motivo: "Aguardando autorização",
    });
    expect(pausado.motivo).toBe("Aguardando autorização");
    expect(pausado.notificacao.status).toBe(EStatusNotificacao.ENVIADA);
  });

  it("reenvio concorrente concede só um claim", async () => {
    const { service, ordem, whatsapp } = await comOrdem();
    whatsapp.enviar.mockRejectedValueOnce(new Error("Zenvia fora"));
    await expect(
      service.addEvento(ordem.id, { status: EStatus.DIAGNOSTICO }),
    ).rejects.toBeInstanceOf(NotificationError);
    const falho = (await service.listEventos(ordem.id))[1];

    const resultados = await Promise.allSettled([
      service.reenviarNotificacao(ordem.id, falho.id),
      service.reenviarNotificacao(ordem.id, falho.id),
    ]);
    expect(resultados.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    expect(resultados.filter((item) => item.status === "rejected")).toHaveLength(1);
    expect(await service.listEventos(ordem.id)).toHaveLength(2);
  });

  it("recupera notificação PENDENTE abandonada", async () => {
    const { service, ordem, repo, whatsapp } = await comOrdem();
    const criado = await service.addEvento(ordem.id, { status: EStatus.DIAGNOSTICO });
    const persistida = repo.items[0].historico[1];
    persistida.notificacao = {
      status: EStatusNotificacao.PENDENTE,
      tentativaId: "tentativa-abandonada",
      ultimaTentativaEm: new Date(Date.now() - 31_000),
      resultadoEnvio: EResultadoEnvio.INCERTO,
    };

    const recuperado = await service.reenviarNotificacao(ordem.id, criado.id);
    expect(recuperado.notificacao.status).toBe(EStatusNotificacao.ENVIADA);
    expect(whatsapp.enviar).toHaveBeenCalledTimes(2);
  });

  it("não reenvia PENDENTE recente", async () => {
    const { service, ordem, repo } = await comOrdem();
    const criado = await service.addEvento(ordem.id, { status: EStatus.DIAGNOSTICO });
    repo.items[0].historico[1].notificacao = {
      status: EStatusNotificacao.PENDENTE,
      tentativaId: "tentativa-recente",
      ultimaTentativaEm: new Date(),
      resultadoEnvio: null,
    };
    await expect(service.reenviarNotificacao(ordem.id, criado.id)).rejects.toBeInstanceOf(ConflictError);
  });
});
