import type { Orcamento } from '../../shared/api/types.ts'
import { formatTelefone, telefoneDigits } from '../clientes/format'
import { formatPlaca } from '../veiculos/format'

export const shortId = (id: string) => `#${id.slice(-6)}`

export const telefoneLabel = (o: Pick<Orcamento, 'telefone'>) => (o.telefone ? formatTelefone(telefoneDigits(o.telefone)) : '—')
export const placaLabel = (o: Pick<Orcamento, 'placa'>) => (o.placa ? formatPlaca(o.placa) : '—')
