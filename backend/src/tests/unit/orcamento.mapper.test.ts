import { ValidationError } from "../../domain/common/errors/app-error";
import { EDecisao } from "../../domain/orcamento/entity/e-decisao";
import { ETipo } from "../../domain/orcamento/entity/e-tipo";
import { Orcamento } from "../../domain/orcamento/entity/orcamento.entity";
import {
  toOrcamentoCreateInput,
  toOrcamentoInput,
  toOrcamentoResponse,
} from "../../application/mappers/orcamento.mapper";

const leadBase = {
  nome: null as string | null,
  telefone: null as string | null,
  placa: null as string | null,
};

const itensPadrao = [{
  descricao: "Pastilha",
  tipo: ETipo.PECA,
  quantidade: 2,
  valorUnitario: 80.25,
}];

describe("orcamento mapper", () => {
  it("create deriva total dos itens sem decisao", () => {
    const input = toOrcamentoCreateInput({
      ...leadBase,
      itens: itensPadrao,
    });

    expect(input.valorCentavos).toBe(16050);
    expect(input.itens[0].valorUnitarioCentavos).toBe(8025);
    expect(input).not.toHaveProperty("decisao");
  });

  it("update mapeia decisao e devolve valor em reais na resposta", () => {
    const input = toOrcamentoInput({
      ...leadBase,
      decisao: EDecisao.PENDENTE,
      itens: itensPadrao,
    });

    expect(input.valorCentavos).toBe(16050);
    expect(input).toMatchObject({
      nome: null,
      telefone: null,
      placa: null,
      decisao: EDecisao.PENDENTE,
    });

    const orcamento: Orcamento = {
      id: "64f000000000000000000001",
      nome: "Lead",
      telefone: "54999999999",
      placa: "ABC1D23",
      decisao: EDecisao.APROVADO,
      decisaoData: new Date("2024-01-01T12:00:00.000Z"),
      valorCentavos: input.valorCentavos,
      itens: input.itens,
    };

    const response = toOrcamentoResponse(orcamento);
    expect(response.valor).toBe(160.5);
    expect(response.itens[0].valorUnitario).toBe(80.25);
    expect(response).toMatchObject({
      nome: "Lead",
      telefone: "54999999999",
      placa: "ABC1D23",
      decisao: EDecisao.APROVADO,
    });
    expect(response).not.toHaveProperty("valorCentavos");
    expect(response).not.toHaveProperty("ordemServicoId");
  });

  it("itens vazios resultam em total zero", () => {
    const input = toOrcamentoCreateInput({ ...leadBase, itens: [] });
    expect(input.valorCentavos).toBe(0);
  });

  it("rejeita valorUnitario com mais de duas casas decimais", () => {
    expect(() => toOrcamentoCreateInput({
      ...leadBase,
      itens: [{
        descricao: "Pastilha",
        tipo: ETipo.PECA,
        quantidade: 1,
        valorUnitario: 10.999,
      }],
    })).toThrow(ValidationError);
  });
});
