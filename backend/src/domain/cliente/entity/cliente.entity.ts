export type Cliente = {
  id: string;
  nome: string;
  documento: string;
  email: string;
};

export type ClienteInput = Omit<Cliente, "id">;
