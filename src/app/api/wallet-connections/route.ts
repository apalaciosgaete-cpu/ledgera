import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SupportedNetwork = "BITCOIN" | "BITCOIN_XPUB" | "ETHEREUM" | "SOLANA" | "XPR";

type WalletConnectionBody = {
  network?: string;
  address?: string;
  label?: string;
  connectionId?: string;
};

const NETWORKS = new Set<SupportedNetwork>([
  "BITCOIN",
  "BITCOIN_XPUB",
  "ETHEREUM",
  "SOLANA",
  "XPR",
]);

const XPR_ENDPOINTS = [
  "https://api.protonnz.com",
  "https://proton.eosusa.io",
];

const BITCOIN_XPUB_PATTERN = /^(xpub|ypub|zpub|tpub|upub|vpub)[1-9A-HJ-NP-Za-km-z]{20,}$/;

function normalizeNetwork(value?: string): SupportedNetwork | null {
  const network = String(value ?? "").trim().toUpperCase() as SupportedNetwork;
  return NETWORKS.has(network) ? network : null;
}

function normalizeAddress(network: SupportedNetwork, value?: string): string {
  const address = String(value ?? "").trim();
  if (network === "ETHEREUM") return address.toLowerCase();
  if (network === "BITCOIN" && address.toLowerCase().startsWith("bc1")) return address.toLowerCase();
  if (network === "XPR") return address.toLowerCase();
  return address;
}

function isValidAddress(network: SupportedNetwork, address: string): boolean {
  if (network === "ETHEREUM") return /^0x[a-f0-9]{40}$/.test(address);

  if (network === "BITCOIN") {
    const bech32 = /^(bc1)[ac-hj-np-z02-9]{11,71}$/;
    const legacy = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    return bech32.test(address) || legacy.test(address);
  }

  if (network === "BITCOIN_XPUB") return BITCOIN_XPUB_PATTERN.test(address);
  if (network === "XPR") return /^(?=.{1,12}$)[a-z1-5]+(?:\.[a-z1-5]+)*$/.test(address);

  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

function explorerUrl(network: SupportedNetwork, address: string): string {
  if (network === "BITCOIN") return `https://mempool.space/address/${encodeURIComponent(address)}`;
  if (network === "BITCOIN_XPUB") return "https://mempool.space/";
  if (network === "ETHEREUM") return `https://etherscan.io/address/${encodeURIComponent(address)}`;
  if (network === "XPR") return `https://explorer.xprnetwork.org/account/${encodeURIComponent(address)}`;
  return `https://solscan.io/account/${encodeURIComponent(address)}`;
}

async function xprRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  let lastError: unknown;

  for (const endpoint of XPR_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) {
        throw new Error(`XPR RPC ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("XPR Network no respondió.");
}

async function validateXprAccount(accountName: string): Promise<void> {
  await xprRequest("/v1/chain/get_account", { account_name: accountName });
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
    let network = normalizeNetwork(body.network);

    if (!network) return fail("Selecciona una red compatible.", 400);

    const rawIdentifier = String(body.address ?? "").trim();
    if (network === "BITCOIN" && BITCOIN_XPUB_PATTERN.test(rawIdentifier)) {
      network = "BITCOIN_XPUB";
    }

    const address = normalizeAddress(network, rawIdentifier);
    if (!address || !isValidAddress(network, address)) {
      return fail(`El identificador no tiene un formato válido para ${network}.`, 422);
    }

    if (network === "XPR") {
      try {
        await validateXprAccount(address);
      } catch {
        return fail("La cuenta no existe o XPR Network no pudo validarla.", 422);
      }
    }

    const label = String(body.label ?? "Wallet pública").trim().slice(0, 80) || "Wallet pública";

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
      network === "XPR"
        ? "Cuenta XPR asociada en modo de solo lectura."
        : network === "BITCOIN_XPUB"
          ? "XPUB de Bitcoin asociada en modo de solo lectura."
          : "Dirección pública asociada en modo de solo lectura.",
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as WalletConnectionBody;
    const connectionId = String(body.connectionId ?? "").trim();
    if (!connectionId) return fail("La conexión es obligatoria.", 400);

    const connection = await prisma.walletConnection.findFirst({
      where: { id: connectionId, userId: auth.user.id, status: "ACTIVE" },
      select: { id: true },
    });

    if (!connection) return fail("La conexión no existe o ya fue desconectada.", 404);

    await prisma.walletConnection.update({
      where: { id: connection.id },
      data: { status: "DISCONNECTED" },
    });

    return ok({ disconnected: true, connectionId }, "Cuenta pública desconectada de LEDGERA.");
  } catch (error) {
    return serverError(error);
  }
}
