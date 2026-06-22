import type { KnowledgeItem } from "../domain/types";

export const platformKnowledge: KnowledgeItem[] = [
  {
    id: "platform-binance",
    domain: "PLATFORM",
    title: "Binance",
    summary: "Plataforma de intercambio usada para compra, venta, retiros, depósitos, trading, earn y reportes CSV.",
    tags: ["binance", "csv binance", "retiro binance", "deposito binance"],
    examples: ["Tengo movimientos en Binance", "Subí CSV de Binance", "Retiré desde Binance"],
    version: "1.0",
  },
  {
    id: "platform-bybit",
    domain: "PLATFORM",
    title: "Bybit",
    summary: "Plataforma de intercambio usada para trading, derivados, depósitos, retiros y reportes exportables.",
    tags: ["bybit", "csv bybit", "futuros", "derivados"],
    examples: ["Operé en Bybit", "Tengo derivados", "Exporté CSV de Bybit"],
    version: "1.0",
  },
  {
    id: "platform-kraken",
    domain: "PLATFORM",
    title: "Kraken",
    summary: "Plataforma de intercambio usada para compra, venta, custodia y reportes de operaciones.",
    tags: ["kraken", "csv kraken", "retiro kraken"],
    examples: ["Tengo fondos en Kraken", "Vendí en Kraken", "Subí reporte Kraken"],
    version: "1.0",
  },
];
