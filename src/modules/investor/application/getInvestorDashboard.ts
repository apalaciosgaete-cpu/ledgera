import { prisma } from "@/lib/prisma";
import { buildUserScopeWhere, type AccessPolicyUser } from "@/modules/identity/domain/accessPolicy";
import {
  calculatePortfolio,
  prefetchFx,
  type CalculatedPortfolioPosition,
  type PortfolioMovement,
  type PortfolioMovementType,
} from "@/modules/portfolio/application/calculatePortfolio";
import { getCoinGeckoPricesUsd } from "@/modules/portfolio/infrastructure/coingecko";
import { getCoinGeckoIdBySymbol } from "@/modules/portfolio/domain/assetMarketMap";
import { round } from "@/shared/utils/math";

type RawPortfolioMovement = {
  id: string;
  type: string;
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  executedAt: Date;
};

type RawTaxEvent = {
  id: string;
  movementId: string;
  realizedPnlUsd: number;
};

export type InvestorTaxStatusCode =
  | "EMPTY"
  | "READY"
  | "NO_TAX_EVENTS"
  | "REVIEW_REQUIRED";

export type InvestorNextActionCode =
  | "IMPORT_MOVEMENTS"
  | "REVIEW_TAX_EVENTS"
  | "REVIEW_PORTFOLIO"
  | "REVIEW_STAKING"
  | "GENERATE_REPORT"
  | "OPEN_TAX_SUMMARY";

export type InvestorDashboard = {
  patrimonio: {
    totalCostClp: number;
    totalCostUsd: number;
    totalMarketValueClp: number;
    totalMarketValueUsd: number;
    assetCount: number;
    marketPricing: {
      source: "COINGECKO" | "COST_FALLBACK";
      pricedAssets: number;
      totalAssets: number;
    };
    fx: {
      usdToClp: number;
      source: string;
      asOf: string;
    };
  };
  rentabilidad: {
    realizedPnlUsd: number;
    realizedPnlClp: number;
    stakingRewardUsd: number;
    stakingRewardClp: number;
    totalReturnUsd: number;
    totalReturnClp: number;
    totalReturnPercent: number | null;
    unrealizedPnlUsd: number;
    unrealizedPnlClp: number;
    unrealizedPnlPercent: number | null;
  };
  activos: {
    symbol: string;
    quantity: number;
    totalCostClp: number;
    totalCostUsd: number;
    currentPriceUsd: number;
    marketValueClp: number;
    marketValueUsd: number;
    unrealizedPnlClp: number;
    unrealizedPnlUsd: number;
    returnPercent: number | null;
    portfolioSharePercent: number;
  }[];
  distribucion: {
    symbol: string;
    percent: number;
    valueClp: number;
  }[];
  destacados: {
    bestAsset: {
      symbol: string;
      returnPercent: number;
      unrealizedPnlClp: number;
    } | null;
    worstAsset: {
      symbol: string;
      returnPercent: number;
      unrealizedPnlClp: number;
    } | null;
  };
  staking: {
    status: "WITH_DATA" | "PLACEHOLDER";
    rewardUsd: number;
    rewardClp: number;
    message: string;
  };
  tributario: {
    status: InvestorTaxStatusCode;
    label: string;
    message: string;
    sellWithoutEvent: number;
    orphanEvents: number;
    totalSellMovements: number;
    totalTaxEvents: number;
  };
  proximaAccion: {
    code: InvestorNextActionCode;
    label: string;
    href: string;
    detail: string;
  };
};

function normalizeMovementType(value: string): PortfolioMovementType | null {
  if (value === "BUY" || value === "SELL" || value === "DEPOSIT" || value === "WITHDRAW" || value === "STAKING_REWARD") {
    return value;
  }

  return null;
}

function toPortfolioMovement(movement: RawPortfolioMovement): PortfolioMovement | null {
  const type = normalizeMovementType(movement.type);
  if (!type) return null;

  return {
    id: movement.id,
    type,
    symbol: movement.symbol,
    quantity: movement.quantity,
    priceUsd: movement.priceUsd,
    feeUsd: movement.feeUsd,
    occurredAt: movement.executedAt,
  };
}

async function buildMarketPriceBySymbol(positions: CalculatedPortfolioPosition[]) {
  const marketIdsBySymbol = new Map<string, string>();

  for (const position of positions) {
    if (position.quantity <= 0) continue;
    const marketId = getCoinGeckoIdBySymbol(position.symbol);
    if (marketId) marketIdsBySymbol.set(position.symbol, marketId);
  }

  if (marketIdsBySymbol.size === 0) {
    return {
      pricesBySymbol: new Map<string, number>(),
      pricedAssets: 0,
    };
  }

  try {
    const marketPrices = await getCoinGeckoPricesUsd(Array.from(marketIdsBySymbol.values()));
    const pricesBySymbol = new Map<string, number>();

    for (const [symbol, marketId] of marketIdsBySymbol) {
      const price = Number(marketPrices[marketId] ?? 0);
      if (Number.isFinite(price) && price > 0) {
        pricesBySymbol.set(symbol, price);
      }
    }

    return {
      pricesBySymbol,
      pricedAssets: pricesBySymbol.size,
    };
  } catch (err) {
    console.warn("[getInvestorDashboard] CoinGecko price fetch failed:", err instanceof Error ? err.message : String(err));
    return {
      pricesBySymbol: new Map<string, number>(),
      pricedAssets: 0,
    };
  }
}

function buildAssets(
  positions: CalculatedPortfolioPosition[],
  totalMarketValueClp: number,
  pricesBySymbol: Map<string, number>,
  usdToClp: number,
) {
  return positions
    .filter((position) => position.quantity > 0)
    .map((position) => {
      const currentPriceUsd = pricesBySymbol.get(position.symbol) ?? position.averageCostUsd;
      const marketValueUsd = round(position.quantity * currentPriceUsd, 2);
      const marketValueClp = round(marketValueUsd * usdToClp, 2);
      const unrealizedPnlUsd = round(marketValueUsd - position.totalCostUsd, 2);
      const unrealizedPnlClp = round(marketValueClp - position.totalCostClp, 2);
      const returnPercent = position.totalCostUsd > 0 ? round((unrealizedPnlUsd / position.totalCostUsd) * 100, 2) : null;

      return {
        symbol: position.symbol,
        quantity: position.quantity,
        totalCostClp: position.totalCostClp,
        totalCostUsd: position.totalCostUsd,
        currentPriceUsd: round(currentPriceUsd, 8),
        marketValueClp,
        marketValueUsd,
        unrealizedPnlClp,
        unrealizedPnlUsd,
        returnPercent,
        portfolioSharePercent: totalMarketValueClp > 0 ? round((marketValueClp / totalMarketValueClp) * 100, 2) : 0,
      };
    })
    .sort((a, b) => b.marketValueClp - a.marketValueClp);
}

function buildHighlights(assets: ReturnType<typeof buildAssets>): InvestorDashboard["destacados"] {
  const rankedAssets = assets
    .filter((asset) => asset.returnPercent !== null)
    .sort((a, b) => Number(b.returnPercent) - Number(a.returnPercent));

  const bestAsset = rankedAssets[0] ?? null;
  const worstAsset = rankedAssets.length > 1 ? rankedAssets[rankedAssets.length - 1] : null;

  return {
    bestAsset: bestAsset
      ? {
        symbol: bestAsset.symbol,
        returnPercent: Number(bestAsset.returnPercent),
        unrealizedPnlClp: bestAsset.unrealizedPnlClp,
      }
      : null,
    worstAsset: worstAsset
      ? {
        symbol: worstAsset.symbol,
        returnPercent: Number(worstAsset.returnPercent),
        unrealizedPnlClp: worstAsset.unrealizedPnlClp,
      }
      : null,
  };
}

function buildTaxStatus(params: {
  movementCount: number;
  sellWithoutEvent: number;
  orphanEvents: number;
  totalSellMovements: number;
  totalTaxEvents: number;
}): InvestorDashboard["tributario"] {
  const { movementCount, sellWithoutEvent, orphanEvents, totalSellMovements, totalTaxEvents } = params;
  const issues = sellWithoutEvent + orphanEvents;

  if (movementCount === 0) {
    return {
      status: "EMPTY",
      label: "Sin movimientos",
      message: "Carga movimientos para calcular portafolio y estado tributario.",
      sellWithoutEvent,
      orphanEvents,
      totalSellMovements,
      totalTaxEvents,
    };
  }

  if (issues > 0) {
    return {
      status: "REVIEW_REQUIRED",
      label: "Revisión requerida",
      message: "Hay ventas o eventos que deben revisarse antes de declarar.",
      sellWithoutEvent,
      orphanEvents,
      totalSellMovements,
      totalTaxEvents,
    };
  }

  if (totalTaxEvents > 0) {
    return {
      status: "READY",
      label: "Listo para revisión",
      message: "Los eventos tributarios generados están consistentes con los movimientos.",
      sellWithoutEvent,
      orphanEvents,
      totalSellMovements,
      totalTaxEvents,
    };
  }

  return {
    status: "NO_TAX_EVENTS",
    label: "Sin ventas tributables detectadas",
    message: "El portafolio no tiene eventos de venta pendientes según los datos actuales.",
    sellWithoutEvent,
    orphanEvents,
    totalSellMovements,
    totalTaxEvents,
  };
}

function buildNextAction(params: {
  movementCount: number;
  taxStatus: InvestorTaxStatusCode;
  assetCount: number;
  stakingRewardUsd: number;
  sellWithoutEvent: number;
  orphanEvents: number;
  realizedPnlUsd: number;
}): InvestorDashboard["proximaAccion"] {
  if (params.movementCount === 0) {
    return {
      code: "IMPORT_MOVEMENTS",
      label: "Cargar movimientos",
      href: "/importaciones",
      detail: "Importa o registra operaciones para activar patrimonio, rentabilidad e impuestos.",
    };
  }

  if (params.sellWithoutEvent > 0 || params.orphanEvents > 0) {
    return {
      code: "REVIEW_TAX_EVENTS",
      label: "Revisar alertas tributarias",
      href: "/impuestos/resumen",
      detail: `Hay ${params.sellWithoutEvent + params.orphanEvents} inconsistencias entre movimientos y eventos tributarios. Resuélvelas antes de generar reportes.`,
    };
  }

  if (params.taxStatus === "REVIEW_REQUIRED") {
    return {
      code: "REVIEW_TAX_EVENTS",
      label: "Revisar tributario",
      href: "/impuestos/resumen",
      detail: "Revisa si corresponde declarar o pagar antes de entrar al detalle técnico.",
    };
  }

  if (params.stakingRewardUsd > 0) {
    return {
      code: "REVIEW_STAKING",
      label: "Revisar staking",
      href: "/staking",
      detail: "Tienes recompensas de staking registradas. Verifica si deben revisarse tributariamente.",
    };
  }

  if (params.realizedPnlUsd < 0) {
    return {
      code: "REVIEW_PORTFOLIO",
      label: "Revisar pérdidas realizadas",
      href: "/inversiones",
      detail: "Tienes pérdidas realizadas. Consulta con tu contador sobre compensación de pérdidas antes de cerrar el período.",
    };
  }

  if (params.assetCount > 0) {
    return {
      code: "REVIEW_PORTFOLIO",
      label: "Revisar inversiones",
      href: "/inversiones",
      detail: "Valida activos, cantidades, valor actual y costos estimados antes de cerrar el período.",
    };
  }

  if (params.taxStatus === "READY" || params.taxStatus === "NO_TAX_EVENTS") {
    return {
      code: "GENERATE_REPORT",
      label: "Generar reporte tributario",
      href: "/tax/reports",
      detail: "Tus datos están actualizados y consistentes. Genera un reporte para revisar con tu contador.",
    };
  }

  return {
    code: "OPEN_TAX_SUMMARY",
    label: "Ver resumen tributario",
    href: "/impuestos/resumen",
    detail: "Consulta el resultado fiscal simple del período actual.",
  };
}

export async function getInvestorDashboard(user: AccessPolicyUser): Promise<InvestorDashboard> {
  const scope = buildUserScopeWhere(user);

  const [rawMovements, taxEvents] = await Promise.all([
    prisma.portfolioMovement.findMany({
      where: {
        deletedAt: null,
        ...scope,
      },
      orderBy: {
        executedAt: "asc",
      },
      select: {
        id: true,
        type: true,
        symbol: true,
        quantity: true,
        priceUsd: true,
        feeUsd: true,
        executedAt: true,
      },
    }) as Promise<RawPortfolioMovement[]>,
    prisma.taxEvent.findMany({
      where: {
        ...scope,
      },
      select: {
        id: true,
        movementId: true,
        realizedPnlUsd: true,
      },
    }) as Promise<RawTaxEvent[]>,
    prefetchFx(),
  ]);

  const movements: PortfolioMovement[] = [];
  let filteredMovementCount = 0;
  for (const raw of rawMovements) {
    const converted = toPortfolioMovement(raw);
    if (converted) {
      movements.push(converted);
    } else {
      filteredMovementCount++;
    }
  }
  if (filteredMovementCount > 0) {
    console.warn(`[getInvestorDashboard] ${filteredMovementCount} movements filtered due to unknown type`);
  }
  const portfolio = await calculatePortfolio(movements);
  const { pricesBySymbol, pricedAssets } = await buildMarketPriceBySymbol(portfolio.positions);
  const totalMarketValueUsd = round(
    portfolio.positions
      .filter((position) => position.quantity > 0)
      .reduce((sum, position) => {
        const currentPriceUsd = pricesBySymbol.get(position.symbol) ?? position.averageCostUsd;
        return sum + position.quantity * currentPriceUsd;
      }, 0),
    2,
  );
  const totalMarketValueClp = round(totalMarketValueUsd * portfolio.fx.usdToClp, 2);
  const assets = buildAssets(portfolio.positions, totalMarketValueClp, pricesBySymbol, portfolio.fx.usdToClp);
  const distribution = assets.slice(0, 8).map((asset) => ({
    symbol: asset.symbol,
    percent: asset.portfolioSharePercent,
    valueClp: asset.marketValueClp,
  }));
  const unrealizedPnlUsd = round(totalMarketValueUsd - portfolio.totals.totalCostUsd, 2);
  const unrealizedPnlClp = round(totalMarketValueClp - portfolio.totals.totalCostClp, 2);

  const movementIds = new Set(rawMovements.map((movement) => movement.id));
  const eventMovementIds = new Set(taxEvents.map((event) => event.movementId));
  const sellMovements = rawMovements.filter((movement) => movement.type === "SELL");
  const sellWithoutEvent = sellMovements.filter((movement) => !eventMovementIds.has(movement.id)).length;
  const orphanEvents = taxEvents.filter((event) => !movementIds.has(event.movementId)).length;
  const realizedPnlUsd = round(taxEvents.reduce((sum, event) => sum + Number(event.realizedPnlUsd || 0), 0), 2);
  const realizedPnlClp = round(realizedPnlUsd * portfolio.fx.usdToClp, 2);
  const stakingRewardUsd = portfolio.totals.totalStakingRewardValueUsd;
  const stakingRewardClp = portfolio.totals.totalStakingRewardValueClp;
  const totalReturnUsd = round(realizedPnlUsd + stakingRewardUsd, 2);
  const totalReturnClp = round(realizedPnlClp + stakingRewardClp, 2);
  const capitalBaseUsd = portfolio.totals.totalCapitalContributedUsd || portfolio.totals.totalBuyCostUsd;
  const taxStatus = buildTaxStatus({
    movementCount: rawMovements.length,
    sellWithoutEvent,
    orphanEvents,
    totalSellMovements: sellMovements.length,
    totalTaxEvents: taxEvents.length,
  });

  return {
    patrimonio: {
      totalCostClp: portfolio.totals.totalCostClp,
      totalCostUsd: portfolio.totals.totalCostUsd,
      totalMarketValueClp,
      totalMarketValueUsd,
      assetCount: portfolio.totals.symbolCount,
      marketPricing: {
        source: pricedAssets > 0 ? "COINGECKO" : "COST_FALLBACK",
        pricedAssets,
        totalAssets: portfolio.totals.symbolCount,
      },
      fx: portfolio.fx,
    },
    rentabilidad: {
      realizedPnlUsd,
      realizedPnlClp,
      stakingRewardUsd,
      stakingRewardClp,
      totalReturnUsd,
      totalReturnClp,
      totalReturnPercent: capitalBaseUsd > 0 ? round((totalReturnUsd / capitalBaseUsd) * 100, 2) : null,
      unrealizedPnlUsd,
      unrealizedPnlClp,
      unrealizedPnlPercent: portfolio.totals.totalCostUsd > 0 ? round((unrealizedPnlUsd / portfolio.totals.totalCostUsd) * 100, 2) : null,
    },
    activos: assets,
    distribucion: distribution,
    destacados: buildHighlights(assets),
    staking: {
      status: stakingRewardUsd > 0 ? "WITH_DATA" : "PLACEHOLDER",
      rewardUsd: stakingRewardUsd,
      rewardClp: stakingRewardClp,
      message: stakingRewardUsd > 0
        ? "Recompensas detectadas desde movimientos STAKING_REWARD."
        : "Sin recompensas de staking registradas todavía.",
    },
    tributario: taxStatus,
    proximaAccion: buildNextAction({
      movementCount: rawMovements.length,
      taxStatus: taxStatus.status,
      assetCount: portfolio.totals.symbolCount,
      stakingRewardUsd,
      sellWithoutEvent,
      orphanEvents,
      realizedPnlUsd,
    }),
  };
}
