import { TemplateWhatsapp } from "../entity/template-whatsapp";

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
