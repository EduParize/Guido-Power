import { AppError } from "../../domain/common/errors/app-error";
import { TemplateWhatsapp } from "../../domain/ordem-servico/entity/template-whatsapp";
import { ZenviaExternalService } from "../../infraestructure/external-service/zenvia/zenvia.external-service";

const config = {
  apiUrl: "https://api.zenvia.com/v2",
  token: "token-ficticio",
  from: "5500000000000",
};

describe("ZenviaExternalService", () => {
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  it("envia o template e o motivo só quando há campos", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    const service = new ZenviaExternalService(config);

    await service.enviar({
      para: "54999999999",
      template: TemplateWhatsapp.ServicoPausado,
      campos: {
        nomeCliente: "Ana",
        veiculo: "Fiat Uno ABC1D23",
        data: "21/10/2026, 18:58",
        status: "PAUSADO",
        motivo: "Aguardando peça",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.zenvia.com/v2/channels/whatsapp/messages",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TOKEN": "token-ficticio",
        },
        body: JSON.stringify({
          from: "5500000000000",
          to: "54999999999",
          contents: [{
            type: "template",
            templateId: TemplateWhatsapp.ServicoPausado,
            fields: {
              nomeCliente: "Ana",
              veiculo: "Fiat Uno ABC1D23",
              data: "21/10/2026, 18:58",
              status: "PAUSADO",
              motivo: "Aguardando peça",
            },
          }],
        }),
      }),
    );
  });

  it("resposta que não é 2xx vira 502 sem expor o token", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 }) as unknown as typeof fetch;
    const service = new ZenviaExternalService(config);
    const campos = {
      nomeCliente: "Ana",
      veiculo: "Fiat Uno ABC1D23",
      data: "21/10/2026, 18:58",
      status: "INICIADO",
    };
    await expect(service.enviar({
      para: "54999999999",
      template: TemplateWhatsapp.ServicoIniciado,
      campos,
    })).rejects.toEqual(expect.any(AppError));
    await expect(service.enviar({
      para: "54999999999",
      template: TemplateWhatsapp.ServicoIniciado,
      campos,
    })).rejects.toMatchObject({ statusCode: 502, message: "Falha ao enviar mensagem no WhatsApp" });
  });
});
