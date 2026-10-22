export interface Usuario {
  id: string
  nome: string
  email: string
  senhaHash: string
}

export type UsuarioInput = Omit<Usuario, 'id'>

export type UsuarioUpdate = Partial<UsuarioInput>
