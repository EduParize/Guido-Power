import { EStatus } from "../../domain/ordem-servico/entity/e-status";
import { EStatusNotificacao } from "../../domain/ordem-servico/entity/evento.entity";
import { OrdemServico } from "../../domain/ordem-servico/entity/ordem-servico.entity";
import {
  toOrdemServicoInput,
  toOrdemServicoResponse,
} from "../../application/mappers/ordem-servico.mapper";

describe("ordem-servico mapper", () => {
  it("mapeia criação com orcamentoId e remove historicoVersao da resposta", () => {
    const input = toOrdemServicoInput({
      veiculoId: "64a000000000000000000010",
      clienteId: "64a000000000000000000020",
      orcamentoId: "64f000000000000000000001",
      descricao: "Revisão",
      status: EStatus.EM_ESPERA,
    });

    expect(input).toEqual({
      veiculoId: "64a000000000000000000010",
      clienteId: "64a000000000000000000020",
      orcamentoId: "64f000000000000000000001",
      descricao: "Revisão",
      status: EStatus.EM_ESPERA,
      motivo: undefined,
    });

    const ordem: OrdemServico = {
      id: "64d000000000000000000001",
      veiculoId: input.veiculoId,
      clienteId: input.clienteId,
      orcamentoId: input.orcamentoId,
      descricao: input.descricao,
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
    };

    const response = toOrdemServicoResponse(ordem);
    expect(response).not.toHaveProperty("historicoVersao");
    expect(response).not.toHaveProperty("decisao");
    expect(response.orcamentoId).toBe("64f000000000000000000001");
    expect(response.descricao).toBe("Revisão");
  });
});
