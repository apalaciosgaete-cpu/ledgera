import type { KnowledgeItem } from "../domain/types";

export const assetKnowledge: KnowledgeItem[] = [
  {
    id: "asset-btc",
    domain: "ASSET",
    title: "Bitcoin",
    summary: "Activo digital descentralizado usado como reserva, inversión o medio de transferencia.",
    tags: ["btc", "bitcoin", "venta btc", "compra btc"],
    examples: ["Vendí Bitcoin", "Compré BTC", "Tengo Bitcoin en Binance"],
    version: "1.0",
  },
  {
    id: "asset-eth",
    domain: "ASSET",
    title: "Ethereum",
    summary: "Red y activo digital usado para transferencias, contratos inteligentes, staking y DeFi.",
    tags: ["eth", "ethereum", "staking", "defi"],
    examples: ["Tengo ETH en staking", "Moví Ethereum", "Usé DeFi con ETH"],
    version: "1.0",
  },
  {
    id: "asset-stablecoins",
    domain: "ASSET",
    title: "Stablecoins",
    summary: "Activos digitales vinculados usualmente a moneda fiduciaria, usados para liquidez y transferencias.",
    tags: ["usdt", "usdc", "stablecoin", "dolar digital"],
    examples: ["Recibí USDT", "Tengo USDC", "Me pagaron en stablecoin"],
    version: "1.0",
  },
];
