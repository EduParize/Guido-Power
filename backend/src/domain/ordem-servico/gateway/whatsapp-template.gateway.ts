import { TemplateWhatsapp } from "../entity/template-whatsapp";
import { EResultadoEnvio } from "../entity/evento.entity";

export type CamposTemplate = {
  nomeCliente: string;
  veiculo: string;
  data: string;
  status: string;
  motivo?: string;
};

export type EnvioTemplate = {
  para: string;
  template: TemplateWhatsapp;
  campos: CamposTemplate;
};

export interface WhatsappTemplateGateway {
  enviar(envio: EnvioTemplate): Promise<void>;
}

export class WhatsappTemplateError extends Error {
  constructor(
    message: string,
    public readonly resultadoEnvio: EResultadoEnvio,
  ) {
    super(message);
    this.name = "WhatsappTemplateError";
  }
}
