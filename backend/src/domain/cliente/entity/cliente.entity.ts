export type Cliente = {
  id: string;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
};

export type ClienteInput = Omit<Cliente, "id">;
