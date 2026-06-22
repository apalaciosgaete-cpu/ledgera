import type { KnowledgeItem } from "../domain/types";

export const custodyKnowledge: KnowledgeItem[] = [
  {
    id: "custody-ledger",
    domain: "CUSTODY",
    title: "Ledger",
    summary: "Dispositivo de autocustodia usado para administrar activos digitales fuera de plataformas centralizadas.",
    tags: ["ledger", "hardware wallet", "autocustodia", "direccion ledger"],
    examples: ["Tengo una Ledger", "Moví fondos a Ledger", "Quiero registrar mi dirección"],
    version: "1.0",
  },
  {
    id: "custody-metamask",
    domain: "CUSTODY",
    title: "Metamask",
    summary: "Billetera digital usada para interactuar con redes, tokens, DeFi y aplicaciones descentralizadas.",
    tags: ["metamask", "wallet", "defi", "direccion metamask"],
    examples: ["Tengo Metamask", "Usé DeFi", "Moví tokens desde Metamask"],
    version: "1.0",
  },
];
