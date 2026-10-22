import { EResultadoEnvio } from "../../../domain/ordem-servico/entity/evento.entity";
import {
  CamposTemplate,
  EnvioTemplate,
  WhatsappTemplateError,
  WhatsappTemplateGateway,
} from "../../../domain/ordem-servico/gateway/whatsapp-template.gateway";

const TIMEOUT_MS = 10000;

export type ZenviaConfig = {
  apiUrl: string;
  token: string;
  from: string;
};

export class ZenviaExternalService implements WhatsappTemplateGateway {
  constructor(private readonly config: ZenviaConfig) {}

  async enviar(envio: EnvioTemplate): Promise<void> {
    const content: { type: "template"; templateId: string; fields: CamposTemplate } = {
      type: "template",
      templateId: envio.template,
      fields: envio.campos,
    };

    const base = this.config.apiUrl.replace(/\/$/, "");
    let response: Response;
    try {
      response = await fetch(`${base}/channels/whatsapp/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TOKEN": this.config.token,
        },
        body: JSON.stringify({
          from: this.config.from,
          to: envio.para,
          contents: [content],
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new WhatsappTemplateError(
        "Resultado do envio da mensagem no WhatsApp é incerto",
        EResultadoEnvio.INCERTO,
      );
    }

    if (!response.ok) {
      throw new WhatsappTemplateError(
        "Mensagem rejeitada pela Zenvia",
        EResultadoEnvio.REJEITADO,
      );
    }
  }
}
