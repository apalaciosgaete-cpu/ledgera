import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

type Row = Record<string, unknown>;

export type DigitalOperatingSnapshot = {
  profile: Row | null;
  cryptoAssets: Row[];
  exchangeAccounts: Row[];
  wallets: Row[];
  sourcesOfFunds: Row[];
  taxObligations: Row[];
  documents: Row[];
  events: Row[];
};

export async function ensureDigitalProfile(userId: string) {
  const existing = await prisma.$queryRawUnsafe<Row[]>(
    "SELECT * FROM digital_profiles WHERE user_id = $1 LIMIT 1",
    userId,
  );

  if (existing[0]) return existing[0];

  const id = randomUUID();
  const created = await prisma.$queryRawUnsafe<Row[]>(
    "INSERT INTO digital_profiles (id, user_id, status, risk_level) VALUES ($1, $2, 'PARTIAL', 'UNASSESSED') RETURNING *",
    id,
    userId,
  );

  await createDigitalSystemEvent({
    userId,
    profileId: id,
    eventType: "DIGITAL_PROFILE_CREATED",
    description: "Perfil de patrimonio digital creado.",
  });

  return created[0];
}

export async function getDigitalOperatingSnapshot(userId: string): Promise<DigitalOperatingSnapshot> {
  const profile = await ensureDigitalProfile(userId);
  const profileId = String(profile.id);

  const [cryptoAssets, exchangeAccounts, wallets, sourcesOfFunds, taxObligations, documents, events] = await Promise.all([
    prisma.$queryRawUnsafe<Row[]>("SELECT * FROM crypto_assets WHERE profile_id = $1 ORDER BY created_at DESC", profileId),
    prisma.$queryRawUnsafe<Row[]>("SELECT * FROM exchange_accounts WHERE profile_id = $1 ORDER BY created_at DESC", profileId),
    prisma.$queryRawUnsafe<Row[]>("SELECT * FROM digital_wallets WHERE profile_id = $1 ORDER BY created_at DESC", profileId),
    prisma.$queryRawUnsafe<Row[]>("SELECT * FROM source_of_funds WHERE profile_id = $1 ORDER BY created_at DESC", profileId),
    prisma.$queryRawUnsafe<Row[]>("SELECT * FROM tax_obligations_crypto WHERE profile_id = $1 ORDER BY created_at DESC", profileId),
    prisma.$queryRawUnsafe<Row[]>("SELECT * FROM digital_documents_crypto WHERE profile_id = $1 ORDER BY created_at DESC", profileId),
    prisma.$queryRawUnsafe<Row[]>("SELECT * FROM digital_system_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25", userId),
  ]);

  return { profile, cryptoAssets, exchangeAccounts, wallets, sourcesOfFunds, taxObligations, documents, events };
}

export async function createCryptoAsset(input: { userId: string; symbol: string; name: string; quantity?: number | null }) {
  const profile = await ensureDigitalProfile(input.userId);
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    "INSERT INTO crypto_assets (id, profile_id, symbol, name, quantity, status) VALUES ($1, $2, $3, $4, $5, 'PARTIAL') RETURNING *",
    id,
    profile.id,
    input.symbol.toUpperCase(),
    input.name,
    input.quantity ?? null,
  );
  await createDigitalSystemEvent({ userId: input.userId, profileId: String(profile.id), eventType: "CRYPTO_ASSET_CREATED", description: `Cryptoactivo agregado: ${input.symbol.toUpperCase()}` });
  return rows[0];
}

export async function createExchangeAccount(input: { userId: string; provider: string; accountLabel: string }) {
  const profile = await ensureDigitalProfile(input.userId);
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    "INSERT INTO exchange_accounts (id, profile_id, provider, account_label, status) VALUES ($1, $2, $3, $4, 'PARTIAL') RETURNING *",
    id,
    profile.id,
    input.provider,
    input.accountLabel,
  );
  await createDigitalSystemEvent({ userId: input.userId, profileId: String(profile.id), eventType: "EXCHANGE_ACCOUNT_CREATED", description: `Exchange agregado: ${input.provider}` });
  return rows[0];
}

export async function createWallet(input: { userId: string; label: string; network: string; address: string }) {
  const profile = await ensureDigitalProfile(input.userId);
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    "INSERT INTO digital_wallets (id, profile_id, label, network, address, owner_declared, status) VALUES ($1, $2, $3, $4, $5, true, 'PARTIAL') RETURNING *",
    id,
    profile.id,
    input.label,
    input.network,
    input.address,
  );
  await createDigitalSystemEvent({ userId: input.userId, profileId: String(profile.id), eventType: "WALLET_CREATED", description: `Wallet agregada: ${input.label}` });
  return rows[0];
}

export async function createDigitalSystemEvent(input: { userId: string; profileId?: string | null; eventType: string; description: string; metadata?: unknown }) {
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    "INSERT INTO digital_system_events (id, user_id, profile_id, event_type, description, metadata) VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING *",
    id,
    input.userId,
    input.profileId ?? null,
    input.eventType,
    input.description,
    JSON.stringify(input.metadata ?? {}),
  );
  return rows[0];
}
