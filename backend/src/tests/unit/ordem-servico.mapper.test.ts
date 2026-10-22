import { ValidationError } from "../../domain/common/errors/app-error";
import { EDecisao } from "../../domain/ordem-servico/entity/e-decisao";
import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { ETipo } from "../../domain/ordem-servico/entity/e-tipo";
import { EStatusNotificacao } from "../../domain/ordem-servico/entity/evento.entity";
import { OrdemServico } from "../../domain/ordem-servico/entity/ordem-servico.entity";
import {
  toOrdemServicoInput,
  toOrdemServicoResponse,
} from "../../application/mappers/ordem-servico.mapper";

describe("ordem-servico mapper", () => {
  it("converte 150.50 e 80.25 reais em centavos e devolve em reais", () => {
    const input = toOrdemServicoInput({
      veiculoId: "64a000000000000000000010",
      clienteId: "64a000000000000000000020",
      decisao: EDecisao.PENDENTE,
      descricao: "Revisão",
      orcamento: 150.5,
      status: EStatus.EM_ESPERA,
      itens: [{
        descricao: "Pastilha",
        tipo: ETipo.PECA,
        quantidade: 2,
        valorUnitario: 80.25,
      }],
    });

    expect(input.orcamentoCentavos).toBe(15050);
    expect(input.itens[0].valorUnitarioCentavos).toBe(8025);

    const ordem: OrdemServico = {
      id: "64d000000000000000000001",
      veiculoId: input.veiculoId,
      clienteId: input.clienteId,
      decisao: input.decisao,
      decisaoData: new Date(),
      descricao: input.descricao,
      orcamentoCentavos: input.orcamentoCentavos,
      status: input.status,
      historico: [{
        id: "64e000000000000000000001",
        status: input.status,
        data: new Date(),
        motivo: null,
        notificacao: {
          status: EStatusNotificacao.NAO_APLICAVEL,
          tentativaId: null,
          ultimaTentativaEm: null,
          resultadoEnvio: null,
        },
      }],
      historicoVersao: 0,
      itens: input.itens,
    };

    const response = toOrdemServicoResponse(ordem);
    expect(response.orcamento).toBe(150.5);
    expect(response.itens[0].valorUnitario).toBe(80.25);
    expect(response).not.toHaveProperty("orcamentoCentavos");
    expect(response).not.toHaveProperty("historicoVersao");
  });

  it("rejeita valor com mais de duas casas decimais", () => {
    expect(() => toOrdemServicoInput({
      veiculoId: "64a000000000000000000010",
      clienteId: "64a000000000000000000020",
      decisao: EDecisao.PENDENTE,
      descricao: "Revisão",
      orcamento: 10.999,
      status: EStatus.EM_ESPERA,
      itens: [{
        descricao: "Pastilha",
        tipo: ETipo.PECA,
        quantidade: 1,
        valorUnitario: 80,
      }],
    })).toThrow(ValidationError);
  });
});
