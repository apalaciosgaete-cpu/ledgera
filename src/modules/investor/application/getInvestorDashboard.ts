import { prisma } from "@/lib/prisma";
import { buildUserScopeWhere, type AccessPolicyUser } from "@/modules/identity/domain/accessPolicy";
import {
  calculatePortfolio,
  prefetchFx,
  type CalculatedPortfolioPosition,
  type PortfolioMovement,
  type PortfolioMovementType,
} from "@/modules/portfolio/application/calculatePortfolio";
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
  | "OPEN_TAX_SUMMARY";

export type InvestorDashboard = {
  patrimonio: {
    totalCostClp: number;
    totalCostUsd: number;
    assetCount: number;
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
  };
  activos: {
    symbol: string;
    quantity: number;
    totalCostClp: number;
    totalCostUsd: number;
    portfolioSharePercent: number;
  }[];
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

function buildAssets(positions: CalculatedPortfolioPosition[], totalCostClp: number) {
  return positions
    .filter((position) => position.quantity > 0)
    .sort((a, b) => b.totalCostClp - a.totalCostClp)
    .slice(0, 8)
    .map((position) => ({
      symbol: position.symbol,
      quantity: position.quantity,
      totalCostClp: position.totalCostClp,
      totalCostUsd: position.totalCostUsd,
      portfolioSharePercent: totalCostClp > 0 ? round((position.totalCostClp / totalCostClp) * 100, 2) : 0,
    }));
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
}): InvestorDashboard["proximaAccion"] {
  if (params.movementCount === 0) {
    return {
      code: "IMPORT_MOVEMENTS",
      label: "Cargar movimientos",
      href: "/importaciones",
      detail: "Importa o registra operaciones para activar patrimonio, rentabilidad e impuestos.",
    };
  }

  if (params.taxStatus === "REVIEW_REQUIRED") {
    return {
      code: "REVIEW_TAX_EVENTS",
      label: "Revisar tributario",
      href: "/tributario",
      detail: "Corrige ventas sin evento o eventos huérfanos antes de preparar reportes.",
    };
  }

  if (params.assetCount > 0) {
    return {
      code: "REVIEW_PORTFOLIO",
      label: "Revisar inversiones",
      href: "/movements",
      detail: "Valida activos, cantidades y costos antes de cerrar el período.",
    };
  }

  return {
    code: "OPEN_TAX_SUMMARY",
    label: "Ver resumen tributario",
    href: "/tax/summary",
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

  const movements = rawMovements
    .map(toPortfolioMovement)
    .filter((movement): movement is PortfolioMovement => Boolean(movement));
  const portfolio = await calculatePortfolio(movements);

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
      assetCount: portfolio.totals.symbolCount,
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
    },
    activos: buildAssets(portfolio.positions, portfolio.totals.totalCostClp),
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
    }),
  };
}
