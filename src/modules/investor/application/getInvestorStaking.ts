import { prisma } from "@/lib/prisma";
import { buildUserScopeWhere, type AccessPolicyUser } from "@/modules/identity/domain/accessPolicy";
import { calculatePortfolio } from "@/modules/portfolio/application/calculatePortfolio";
import { round } from "@/shared/utils/math";

type RawStakingMovement = {
  id: string;
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  source: string;
  executedAt: Date;
};

export type InvestorStaking = {
  status: "WITH_DATA" | "PLACEHOLDER";
  totals: {
    rewardUsd: number;
    rewardClp: number;
    quantity: number;
    eventCount: number;
    assetCount: number;
  };
  byAsset: {
    symbol: string;
    quantity: number;
    rewardUsd: number;
    rewardClp: number;
    eventCount: number;
    lastRewardAt: string;
    sharePercent: number;
  }[];
  bySource: {
    source: string;
    rewardUsd: number;
    rewardClp: number;
    eventCount: number;
  }[];
  byYear: {
    year: number;
    rewardUsd: number;
    rewardClp: number;
    eventCount: number;
  }[];
  recentRewards: {
    id: string;
    symbol: string;
    quantity: number;
    priceUsd: number;
    rewardUsd: number;
    rewardClp: number;
    source: string;
    executedAt: string;
  }[];
  taxNote: {
    label: string;
    detail: string;
  };
  fx: {
    usdToClp: number;
    source: string;
    asOf: string;
  };
};

function addToGroup<T extends { rewardUsd: number; rewardClp: number; eventCount: number }>(
  map: Map<string, T>,
  key: string,
  create: () => T,
  rewardUsd: number,
  rewardClp: number,
) {
  const current = map.get(key) ?? create();
  current.rewardUsd = round(current.rewardUsd + rewardUsd, 2);
  current.rewardClp = round(current.rewardClp + rewardClp, 2);
  current.eventCount += 1;
  map.set(key, current);
  return current;
}

export async function getInvestorStaking(user: AccessPolicyUser): Promise<InvestorStaking> {
  const scope = buildUserScopeWhere(user);

  const portfolioFx = await calculatePortfolio([]);
  const usdToClp = portfolioFx.fx.usdToClp;

  const rewards = await prisma.portfolioMovement.findMany({
    where: {
      deletedAt: null,
      type: "STAKING_REWARD",
      ...scope,
    },
    orderBy: [
      { executedAt: "desc" },
      { id: "desc" },
    ],
    select: {
      id: true,
      symbol: true,
      quantity: true,
      priceUsd: true,
      feeUsd: true,
      source: true,
      executedAt: true,
    },
  }) as RawStakingMovement[];

  const byAssetMap = new Map<string, {
    symbol: string;
    quantity: number;
    rewardUsd: number;
    rewardClp: number;
    eventCount: number;
    lastRewardAt: string;
    sharePercent: number;
  }>();
  const bySourceMap = new Map<string, InvestorStaking["bySource"][number]>();
  const byYearMap = new Map<string, InvestorStaking["byYear"][number]>();

  let totalRewardUsd = 0;
  let totalRewardClp = 0;
  let totalQuantity = 0;

  for (const reward of rewards) {
    const quantity = Number(reward.quantity || 0);
    const rewardUsd = round(quantity * Number(reward.priceUsd || 0), 2);
    const rewardClp = round(rewardUsd * usdToClp, 2);
    const symbol = reward.symbol.trim().toUpperCase();
    const source = reward.source || "MANUAL";
    const year = reward.executedAt.getUTCFullYear();

    totalRewardUsd = round(totalRewardUsd + rewardUsd, 2);
    totalRewardClp = round(totalRewardClp + rewardClp, 2);
    totalQuantity = round(totalQuantity + quantity, 8);

    const asset = byAssetMap.get(symbol) ?? {
      symbol,
      quantity: 0,
      rewardUsd: 0,
      rewardClp: 0,
      eventCount: 0,
      lastRewardAt: reward.executedAt.toISOString(),
      sharePercent: 0,
    };
    asset.quantity = round(asset.quantity + quantity, 8);
    asset.rewardUsd = round(asset.rewardUsd + rewardUsd, 2);
    asset.rewardClp = round(asset.rewardClp + rewardClp, 2);
    asset.eventCount += 1;
    if (new Date(asset.lastRewardAt).getTime() < reward.executedAt.getTime()) {
      asset.lastRewardAt = reward.executedAt.toISOString();
    }
    byAssetMap.set(symbol, asset);

    addToGroup(
      bySourceMap,
      source,
      () => ({ source, rewardUsd: 0, rewardClp: 0, eventCount: 0 }),
      rewardUsd,
      rewardClp,
    );

    addToGroup(
      byYearMap,
      String(year),
      () => ({ year, rewardUsd: 0, rewardClp: 0, eventCount: 0 }),
      rewardUsd,
      rewardClp,
    );
  }

  const byAsset = Array.from(byAssetMap.values())
    .map((asset) => ({
      ...asset,
      sharePercent: totalRewardClp > 0 ? round((asset.rewardClp / totalRewardClp) * 100, 2) : 0,
    }))
    .sort((a, b) => b.rewardClp - a.rewardClp);

  return {
    status: rewards.length > 0 ? "WITH_DATA" : "PLACEHOLDER",
    totals: {
      rewardUsd: totalRewardUsd,
      rewardClp: totalRewardClp,
      quantity: totalQuantity,
      eventCount: rewards.length,
      assetCount: byAsset.length,
    },
    byAsset,
    bySource: Array.from(bySourceMap.values()).sort((a, b) => b.rewardClp - a.rewardClp),
    byYear: Array.from(byYearMap.values()).sort((a, b) => b.year - a.year),
    recentRewards: rewards.slice(0, 8).map((reward) => {
      const rewardUsd = round(Number(reward.quantity || 0) * Number(reward.priceUsd || 0), 2);
      return {
        id: reward.id,
        symbol: reward.symbol.trim().toUpperCase(),
        quantity: round(Number(reward.quantity || 0), 8),
        priceUsd: round(Number(reward.priceUsd || 0), 8),
        rewardUsd,
        rewardClp: round(rewardUsd * usdToClp, 2),
        source: reward.source || "MANUAL",
        executedAt: reward.executedAt.toISOString(),
      };
    }),
    taxNote: rewards.length > 0
      ? {
        label: "Detectado para revision tributaria",
        detail: "Las recompensas STAKING_REWARD se presentan como ingreso percibido y deben revisarse antes de declarar.",
      }
      : {
        label: "Sin staking registrado",
        detail: "Cuando importes rewards o los registres manualmente, apareceran aca con monto, origen y fecha.",
      },
    fx: portfolioFx.fx,
  };
}
