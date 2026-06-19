import type { KnowledgeItem } from "../domain/types";

export const taxEventKnowledge: KnowledgeItem[] = [
  {
    id: "tax-event-disposal",
    domain: "TAX",
    title: "Enajenación de activo digital",
    summary: "Operación donde un activo digital deja el patrimonio del usuario y requiere evaluar valor, costo y respaldo.",
    tags: ["enajenacion", "venta", "salida", "resultado", "ganancia"],
    examples: ["Vendí Bitcoin", "Convertí USDT a pesos", "Retiré resultado"],
    version: "1.0",
  },
  {
    id: "tax-event-exchange",
    domain: "TAX",
    title: "Intercambio entre activos digitales",
    summary: "Operación entre activos digitales que requiere determinar equivalencia, costo y soporte documental.",
    tags: ["intercambio", "conversion", "swap", "cambio"],
    examples: ["Cambié ETH por USDT", "Convertí BTC a ETH", "Hice un intercambio"],
    version: "1.0",
  },
  {
    id: "tax-event-yield",
    domain: "TAX",
    title: "Rendimiento digital",
    summary: "Recepción de rendimiento asociado a activos digitales, plataformas o protocolos.",
    tags: ["rendimiento", "staking", "earn", "recompensa"],
    examples: ["Tengo staking", "Recibí recompensas", "Usé producto earn"],
    version: "1.0",
  },
];
