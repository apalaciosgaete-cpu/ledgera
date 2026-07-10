import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SupportedNetwork = "BITCOIN" | "ETHEREUM" | "SOLANA";

type WalletConnectionBody = {
  network?: string;
  address?: string;
  label?: string;
};

const NETWORKS = new Set<SupportedNetwork>(["BITCOIN", "ETHEREUM", "SOLANA"]);

function normalizeNetwork(value?: string): SupportedNetwork | null {
  const network = String(value ?? "").trim().toUpperCase() as SupportedNetwork;
  return NETWORKS.has(network) ? network : null;
}

function normalizeAddress(network: SupportedNetwork, value?: string): string {
  const address = String(value ?? "").trim();
  if (network === "ETHEREUM") return address.toLowerCase();
  if (network === "BITCOIN" && address.toLowerCase().startsWith("bc1")) return address.toLowerCase();
  return address;
}

function isValidAddress(network: SupportedNetwork, address: string): boolean {
  if (network === "ETHEREUM") return /^0x[a-f0-9]{40}$/.test(address);

  if (network === "BITCOIN") {
    const bech32 = /^(bc1)[ac-hj-np-z02-9]{11,71}$/;
    const legacy = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    return bech32.test(address) || legacy.test(address);
  }

  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

function explorerUrl(network: SupportedNetwork, address: string): string {
  if (network === "BITCOIN") return `https://mempool.space/address/${encodeURIComponent(address)}`;
  if (network === "ETHEREUM") return `https://etherscan.io/address/${encodeURIComponent(address)}`;
  return `https://solscan.io/account/${encodeURIComponent(address)}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const connections = await prisma.walletConnection.findMany({
      where: { userId: auth.user.id, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return ok(
      connections.map((connection) => ({
        ...connection,
        explorerUrl: explorerUrl(connection.network as SupportedNetwork, connection.address),
      })),
      "Conexiones de wallets cargadas.",
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as WalletConnectionBody;
    const network = normalizeNetwork(body.network);

    if (!network) return fail("Selecciona una red compatible.", 400);

    const address = normalizeAddress(network, body.address);
    if (!address || !isValidAddress(network, address)) {
      return fail(`La dirección no tiene un formato válido para ${network}.`, 422);
    }

    const label = String(body.label ?? "Wallet fría").trim().slice(0, 80) || "Wallet fría";

    const connection = await prisma.walletConnection.upsert({
      where: {
        userId_network_address: {
          userId: auth.user.id,
          network,
          address,
        },
      },
      update: {
        label,
        status: "ACTIVE",
      },
      create: {
        userId: auth.user.id,
        network,
        address,
        label,
        status: "ACTIVE",
      },
    });

    return ok(
      {
        ...connection,
        explorerUrl: explorerUrl(network, address),
      },
      "Dirección pública conectada en modo de solo lectura.",
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}
