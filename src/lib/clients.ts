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
  {
    id: "minerva",
    name: "Minerva",
    description: "Conversor de planilha financeira.",
    route: "/cliente/minerva",
  },
  {
    id: "danone",
    name: "Danone",
    description: "Conversor de planilha financeira.",
    route: "/cliente/danone",
  },
  {
    id: "platlog",
    name: "Platlog",
    description: "Conversor de planilha financeira.",
    route: "/cliente/platlog",
  },
  {
    id: "jbs",
    name: "JBS",
    description: "Conversor de planilha financeira.",
    route: "/cliente/jbs",
  },
  {
    id: "natura",
    name: "Natura",
    description: "Conversor de planilha financeira.",
    route: "/cliente/natura",
  },
];
