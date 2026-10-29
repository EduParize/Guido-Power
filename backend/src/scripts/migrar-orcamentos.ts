/**
 * Migra:
 * 1) vínculo invertido (orcamento.ordemServicoId) → ordem.orcamentoId
 * 2) decisao/decisaoData da ordem → orçamento vinculado; unset na ordem
 * 3) lead ausente permanece null (não cria placeholders)
 *
 * Uso: npx tsx src/scripts/migrar-orcamentos.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import { loadEnv } from "../configuration/env-constants/env";
import { EDecisao } from "../domain/orcamento/entity/e-decisao";
import { OrcamentoModel } from "../infraestructure/db/mongo/models/orcamento.model";
import { OrdemServicoModel } from "../infraestructure/db/mongo/models/ordem-servico.model";

type OrcamentoLegado = {
  _id: mongoose.Types.ObjectId;
  ordemServicoId?: mongoose.Types.ObjectId;
  nome?: string | null;
  telefone?: string | null;
  placa?: string | null;
  decisao?: string;
  decisaoData?: Date;
};

type OrdemLegada = {
  _id: mongoose.Types.ObjectId;
  orcamentoId?: mongoose.Types.ObjectId;
  decisao?: string;
  decisaoData?: Date;
};

async function migrarVinculoInvertido() {
  const orcamentos = (await OrcamentoModel.collection
    .find({ ordemServicoId: { $exists: true } })
    .toArray()) as OrcamentoLegado[];

  let migrados = 0;
  let falhas = 0;

  for (const orcamento of orcamentos) {
    if (!orcamento.ordemServicoId) {
      falhas += 1;
      continue;
    }

    const ordem = await OrdemServicoModel.collection.findOne({ _id: orcamento.ordemServicoId });
    if (!ordem) {
      console.warn(`Ordem ${orcamento.ordemServicoId.toString()} não encontrada para orçamento ${orcamento._id.toString()}`);
      falhas += 1;
      continue;
    }

    await OrdemServicoModel.collection.updateOne(
      { _id: orcamento.ordemServicoId },
      { $set: { orcamentoId: orcamento._id } },
    );
    await OrcamentoModel.collection.updateOne(
      { _id: orcamento._id },
      { $unset: { ordemServicoId: "" } },
    );
    migrados += 1;
  }

  return { migrados, falhas };
}

async function migrarDecisaoParaOrcamento() {
  const ordens = (await OrdemServicoModel.collection
    .find({
      orcamentoId: { $exists: true },
      $or: [{ decisao: { $exists: true } }, { decisaoData: { $exists: true } }],
    })
    .toArray()) as OrdemLegada[];

  let migrados = 0;
  let falhas = 0;

  for (const ordem of ordens) {
    if (!ordem.orcamentoId) {
      falhas += 1;
      continue;
    }

    const orcamento = await OrcamentoModel.collection.findOne({ _id: ordem.orcamentoId }) as OrcamentoLegado | null;
    if (!orcamento) {
      console.warn(`Orçamento ${ordem.orcamentoId.toString()} não encontrado para ordem ${ordem._id.toString()}`);
      falhas += 1;
      continue;
    }

    const decisao = ordem.decisao ?? orcamento.decisao ?? EDecisao.PENDENTE;
    const decisaoData = ordem.decisaoData ?? orcamento.decisaoData ?? new Date();

    await OrcamentoModel.collection.updateOne(
      { _id: ordem.orcamentoId },
      {
        $set: {
          decisao,
          decisaoData,
          nome: orcamento.nome ?? null,
          telefone: orcamento.telefone ?? null,
          placa: orcamento.placa ?? null,
        },
      },
    );
    await OrdemServicoModel.collection.updateOne(
      { _id: ordem._id },
      { $unset: { decisao: "", decisaoData: "" } },
    );
    migrados += 1;
  }

  return { migrados, falhas };
}

async function migrar() {
  const env = loadEnv();
  await mongoose.connect(env.MONGO_URI);

  const vinculo = await migrarVinculoInvertido();
  const decisao = await migrarDecisaoParaOrcamento();

  const ordensSemOrcamento = await OrdemServicoModel.collection.countDocuments({
    orcamentoId: { $exists: false },
  });
  const ordensComDecisao = await OrdemServicoModel.collection.countDocuments({
    $or: [{ decisao: { $exists: true } }, { decisaoData: { $exists: true } }],
  });

  console.log(`Vínculos invertidos migrados: ${vinculo.migrados} (falhas: ${vinculo.falhas}).`);
  console.log(`Decisões transferidas para orçamento: ${decisao.migrados} (falhas: ${decisao.falhas}).`);
  console.log(`Ordens sem orcamentoId: ${ordensSemOrcamento}. Ordens ainda com decisão: ${ordensComDecisao}.`);
  await mongoose.disconnect();
}

migrar().catch(async (erro) => {
  console.error(erro);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
