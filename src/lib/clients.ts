export interface ClientConfig {
  id: string;
  name: string;
  description: string;
  route: string;
}

export const clients: ClientConfig[] = [
  {
    id: "martin-brower",
    name: "Martin Brower",
    description: "Conversão de planilha de recebimentos para baixa por aviso bancário.",
    route: "/cliente/martin-brower",
  },
];
