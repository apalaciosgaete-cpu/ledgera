import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import {
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_SECONDS,
  CONSENT_POLICY_VERSION,
  CONSENT_REGIME,
  ConsentCategories,
  buildConsentSnapshot,
  describeConsentDecision,
  normalizeConsentCategories,
} from "@/lib/privacy/consent";

export const dynamic = "force-dynamic";

const CONSENT_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.LEDGERA_CONSENT_AUDIT_SECRET ||
  "ledgera-local-consent-audit-secret";

type ConsentBody = {
  categories?: Partial<ConsentCategories>;
  choices?: Partial<ConsentCategories>;
};

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: ConsentBody = {};
  try {
    body = (await req.json()) as ConsentBody;
  } catch {
    body = {};
  }

  const categories = normalizeConsentCategories(body.categories ?? body.choices ?? {});
  const previous = readConsentCookie(req.cookies.get(CONSENT_COOKIE_NAME)?.value);
  const anonId = previous?.id || crypto.randomUUID();
  const decidedAt = new Date().toISOString();
  const decisionType = describeConsentDecision(categories);
  const user = await safeSessionUser(req);
  const ipHash = hmac(firstForwardedIp(req.headers.get("x-forwarded-for")) || req.headers.get("x-real-ip") || "");
  const userAgentHash = hmac(req.headers.get("user-agent") || "");
  const proofHash = proofFor({ anonId, categories, decidedAt, decisionType });

  await ensureConsentTable();

  await prisma.$executeRaw`
    INSERT INTO privacy_consent_audit_logs (
      id,
      "anonId",
      "userId",
      regime,
      "policyVersion",
      categories,
      "decisionType",
      "proofHash",
      "ipHash",
      "userAgentHash",
      "createdAt"
    ) VALUES (
      ${crypto.randomUUID()},
      ${anonId},
      ${user?.id || null},
      ${CONSENT_REGIME},
      ${CONSENT_POLICY_VERSION},
      ${JSON.stringify(categories)}::jsonb,
      ${decisionType},
      ${proofHash},
      ${ipHash || null},
      ${userAgentHash || null},
      ${decidedAt}::timestamptz
    )
  `;

  const consent = buildConsentSnapshot({
    id: anonId,
    categories,
    decidedAt,
    serverLogged: true,
    proofHash,
  });

  const response = NextResponse.json({ ok: true, consent });
  response.cookies.set(CONSENT_COOKIE_NAME, JSON.stringify(consent), {
    path: "/",
    maxAge: CONSENT_MAX_AGE_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });

  return response;
}

async function ensureConsentTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS privacy_consent_audit_logs (
      id TEXT PRIMARY KEY,
      "anonId" TEXT NOT NULL,
      "userId" TEXT,
      regime TEXT NOT NULL,
      "policyVersion" TEXT NOT NULL,
      categories JSONB NOT NULL,
      "decisionType" TEXT NOT NULL,
      "proofHash" TEXT NOT NULL,
      "ipHash" TEXT,
      "userAgentHash" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_privacy_consent_anon ON privacy_consent_audit_logs ("anonId")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_privacy_consent_user ON privacy_consent_audit_logs ("userId")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_privacy_consent_created ON privacy_consent_audit_logs ("createdAt")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_privacy_consent_policy ON privacy_consent_audit_logs ("policyVersion")
  `);
}

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  const host = req.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function safeSessionUser(req: NextRequest): Promise<{ id: string } | null> {
  try {
    const session = await getSessionFromRequest(req);
    return session?.user?.id ? { id: session.user.id } : null;
  } catch {
    return null;
  }
}

function readConsentCookie(raw: string | undefined): { id?: string } | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { id?: unknown };
    return typeof parsed.id === "string" ? { id: parsed.id } : null;
  } catch {
    return null;
  }
}

function proofFor(args: {
  anonId: string;
  categories: ConsentCategories;
  decidedAt: string;
  decisionType: string;
}) {
  return hmac(
    JSON.stringify({
      anonId: args.anonId,
      regime: CONSENT_REGIME,
      policyVersion: CONSENT_POLICY_VERSION,
      categories: args.categories,
      decisionType: args.decisionType,
      decidedAt: args.decidedAt,
    })
  );
}

function hmac(value: string): string {
  if (!value) return "";
  return crypto.createHmac("sha256", CONSENT_SECRET).update(value).digest("hex");
}

function firstForwardedIp(value: string | null): string {
  return value?.split(",")[0]?.trim() || "";
}
