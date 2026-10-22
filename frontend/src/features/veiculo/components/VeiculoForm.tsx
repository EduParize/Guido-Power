import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Cliente } from '../../cliente/types'
import type { Veiculo, VeiculoInput } from '../types'

interface VeiculoFormProps {
  veiculo?: Veiculo | null
  clientes: Cliente[]
  isSaving: boolean
  onSubmit: (input: VeiculoInput) => void
}

export function VeiculoForm({ veiculo, clientes, isSaving, onSubmit }: VeiculoFormProps) {
  const [valores, setValores] = useState<VeiculoInput>({
    modelo: veiculo?.modelo ?? '',
    marca: veiculo?.marca ?? '',
    ano: veiculo?.ano ?? '',
    placa: veiculo?.placa ?? '',
    dono: veiculo?.dono ?? '',
  })

  function atualizar(campo: keyof VeiculoInput, valor: string) {
    setValores((atual) => ({ ...atual, [campo]: valor }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(valores)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          Placa
          <input
            className="input mt-1"
            value={valores.placa}
            onChange={(event) => atualizar('placa', event.target.value)}
            required
          />
          <span className="field-hint">Ex.: ABC1D23</span>
        </label>

        <label className="field-label">
          Dono
          <select
            className="input mt-1"
            value={valores.dono}
            onChange={(event) => atualizar('dono', event.target.value)}
            required
          >
            <option value="">Selecione um cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Marca
          <input
            className="input mt-1"
            value={valores.marca}
            onChange={(event) => atualizar('marca', event.target.value)}
            required
          />
        </label>

        <label className="field-label">
          Modelo
          <input
            className="input mt-1"
            value={valores.modelo}
            onChange={(event) => atualizar('modelo', event.target.value)}
            required
          />
        </label>

        <label className="field-label">
          Ano
          <input
            className="input mt-1"
            value={valores.ano}
            onChange={(event) => atualizar('ano', event.target.value)}
            required
          />
        </label>
      </div>

      <div className="form-footer">
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
        <Link to="/veiculos" className="btn-secondary">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
