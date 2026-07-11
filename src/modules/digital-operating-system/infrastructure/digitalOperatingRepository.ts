import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

type Row = Record<string, unknown>;

export type DigitalOperatingSnapshot = {
  profile: Row | null;
  cryptoAssets: Row[];
  exchangeAccounts: Row[];
  sourcesOfFunds: Row[];
  taxObligations: Row[];
  documents: Row[];
  events: Row[];
};

export async function ensureDigitalProfile(userId: string) {
  const existing = await prisma.$queryRawUnsafe<Row[]>("SELECT * FROM digital_profiles WHERE user_id = $1 LIMIT 1", userId);
  if (existing[0]) return existing[0];

  const id = randomUUID();
  const created = await prisma.$queryRawUnsafe<Row[]>("INSERT INTO digital_profiles (id, user_id, status, risk_level) VALUES ($1, $2, 'PARTIAL', 'UNASSESSED') RETURNING *", id, userId);
  await createDigitalSystemEvent({ userId, profileId: id, eventType: "DIGITAL_PROFILE_CREATED", description: "Perfil de patrimonio digital creado." });
  return created[0];
}

export async function getDigitalOperatingSnapshot(userId: string): Promise<DigitalOperatingSnapshot> {
  const profile = await ensureDigitalProfile(userId);
  const profileId = String(profile.id);
  const [cryptoAssets, exchangeAccounts, sourcesOfFunds, taxObligations, documents, events] = await Promise.all([
    prisma.$queryRawUnsafe<Row[]>("SELECT * FROM crypto_assets WHERE profile_id = $1 ORDER BY created_at DESC", profileId),
    prisma.$queryRawUnsafe<Row[]>("SELECT * FROM exchange_accounts WHERE profile_id = $1 ORDER BY created_at DESC", profileId),
    prisma.$queryRawUnsafe<Row[]>("SELECT * FROM source_of_funds WHERE profile_id = $1 ORDER BY created_at DESC", profileId),
    prisma.$queryRawUnsafe<Row[]>("SELECT * FROM tax_obligations_crypto WHERE profile_id = $1 ORDER BY created_at DESC", profileId),
    prisma.$queryRawUnsafe<Row[]>("SELECT * FROM digital_documents_crypto WHERE profile_id = $1 ORDER BY created_at DESC", profileId),
    prisma.$queryRawUnsafe<Row[]>("SELECT * FROM digital_system_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25", userId),
  ]);
  return { profile, cryptoAssets, exchangeAccounts, sourcesOfFunds, taxObligations, documents, events };
}

export async function createCryptoAsset(input: { userId: string; symbol: string; name: string; quantity?: number | null }) {
  const profile = await ensureDigitalProfile(input.userId);
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Row[]>("INSERT INTO crypto_assets (id, profile_id, symbol, name, quantity, status) VALUES ($1, $2, $3, $4, $5, 'PARTIAL') RETURNING *", id, profile.id, input.symbol.toUpperCase(), input.name, input.quantity ?? null);
  await createDigitalSystemEvent({ userId: input.userId, profileId: String(profile.id), eventType: "CRYPTO_ASSET_CREATED", description: `Cryptoactivo agregado: ${input.symbol.toUpperCase()}` });
  return rows[0];
}

export async function createExchangeAccount(input: { userId: string; provider: string; accountLabel: string }) {
  const profile = await ensureDigitalProfile(input.userId);
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Row[]>("INSERT INTO exchange_accounts (id, profile_id, provider, account_label, status) VALUES ($1, $2, $3, $4, 'PARTIAL') RETURNING *", id, profile.id, input.provider, input.accountLabel);
  await createDigitalSystemEvent({ userId: input.userId, profileId: String(profile.id), eventType: "EXCHANGE_ACCOUNT_CREATED", description: `Exchange agregado: ${input.provider}` });
  return rows[0];
}

export async function createSourceOfFunds(input: { userId: string; category: string; description: string; amountClp?: number | null }) {
  const profile = await ensureDigitalProfile(input.userId);
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Row[]>("INSERT INTO source_of_funds (id, profile_id, category, description, amount_clp, evidence_status) VALUES ($1, $2, $3, $4, $5, 'PARTIAL') RETURNING *", id, profile.id, input.category, input.description, input.amountClp ?? null);
  await createDigitalSystemEvent({ userId: input.userId, profileId: String(profile.id), eventType: "SOURCE_OF_FUNDS_CREATED", description: `Origen de fondos agregado: ${input.category}` });
  return rows[0];
}

export async function createTaxObligation(input: { userId: string; eventType: string; period: string; description: string }) {
  const profile = await ensureDigitalProfile(input.userId);
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Row[]>("INSERT INTO tax_obligations_crypto (id, profile_id, event_type, period, description, status) VALUES ($1, $2, $3, $4, $5, 'PARTIAL') RETURNING *", id, profile.id, input.eventType, input.period, input.description);
  await createDigitalSystemEvent({ userId: input.userId, profileId: String(profile.id), eventType: "TAX_OBLIGATION_CREATED", description: `Obligación tributaria agregada: ${input.eventType}` });
  return rows[0];
}

export async function createDigitalDocument(input: { userId: string; name: string; category: string; relatedModule: string; fileUrl?: string | null }) {
  const profile = await ensureDigitalProfile(input.userId);
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Row[]>("INSERT INTO digital_documents_crypto (id, profile_id, name, category, status, file_url, related_module) VALUES ($1, $2, $3, $4, 'PARTIAL', $5, $6) RETURNING *", id, profile.id, input.name, input.category, input.fileUrl ?? null, input.relatedModule);
  await createDigitalSystemEvent({ userId: input.userId, profileId: String(profile.id), eventType: "DIGITAL_DOCUMENT_CREATED", description: `Documento agregado: ${input.name}` });
  return rows[0];
}

export async function createDigitalSystemEvent(input: { userId: string; profileId?: string | null; eventType: string; description: string; metadata?: unknown }) {
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Row[]>("INSERT INTO digital_system_events (id, user_id, profile_id, event_type, description, metadata) VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING *", id, input.userId, input.profileId ?? null, input.eventType, input.description, JSON.stringify(input.metadata ?? {}));
  return rows[0];
}
