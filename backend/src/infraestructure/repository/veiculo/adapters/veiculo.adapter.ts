import { Veiculo } from "../../../../domain/veiculo/entity/veiculo.entity";
import { VeiculoDocument } from "../../../db/mongo/schema/veiculo.schema";

export function toVeiculo(doc: VeiculoDocument): Veiculo {
  return {
    id: doc._id.toString(),
    modelo: doc.modelo,
    ano: doc.ano,
    marca: doc.marca,
    placa: doc.placa,
    dono: doc.dono.toString(),
  };
}