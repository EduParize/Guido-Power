import { AppError } from "../../../domain/common/errors/app-error";
import { CamposTemplate, EnvioTemplate, WhatsappTemplateGateway } from "../../../domain/ordem-servico/gateway/whatsapp-template.gateway";

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
    const response = await fetch(`${base}/channels/whatsapp/messages`, {
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
    });

    if (!response.ok) {
      throw new AppError("Falha ao enviar mensagem no WhatsApp", 502);
    }
  }
}
