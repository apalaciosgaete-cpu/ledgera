import { NextRequest, NextResponse } from "next/server";
import { getSessionByToken } from "@/modules/identity/infrastructure/sessionRepository";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";

export type MovementType = "BUY" | "SELL";

export type MovementDto = {
  id: string;
  type: MovementType | string;
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  executedAt: Date;
  suggestedTaxCategory?: string;
  appliedTaxCategory?: string | null;
  taxClassificationSource?: string;
  deletedAt?: Date | null;
  deletedReason?: string | null;
};

export type TaxEventDto = {
  id: string;
  movementId: string;
  eventType: string;
  symbol: string;
  executedAt: Date;
  quantity: number;
  effectiveTaxCategory: string;
  averageCostUsdAtSale?: number;
  proceedsGrossUsd?: number;
  proceedsNetUsd?: number;
  costBasisUsd?: number;
  feeUsd?: number;
  realizedPnlUsd?: number;
  usdClp?: number;
  proceedsGrossClp?: number;
  proceedsNetClp?: number;
  costBasisClp?: number;
  feeClp?: number;
  realizedPnlClp?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SessionUser = {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
};

export type SessionData = {
  user: SessionUser;
  token: string;
};

function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  return req.cookies.get("session_token")?.value ?? null;
}

async function getSessionFromToken(token: string): Promise<SessionData | null> {
  if (!token) return null;

  const session = await getSessionByToken(token);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  const user = await getUserById(session.userId);
  if (!user) return null;

  if (user.status !== "active") {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    token: session.token,
  };
}

export async function getSession(req: NextRequest): Promise<SessionData | null> {
  const token = extractToken(req);
  if (!token) return null;

  return getSessionFromToken(token);
}

export async function requireAuth(
  req: NextRequest,
  options?: { optional?: boolean },
): Promise<SessionData | NextResponse | null> {
  const session = await getSession(req);

  if (!session && options?.optional) {
    return null;
  }

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "No autorizado",
        data: null,
      },
      { status: 401 },
    );
  }

  return session;
}

export function withAuth(
  handler: (req: NextRequest, session: SessionData) => Promise<NextResponse>,
) {
  return async (req: NextRequest) => {
    const auth = await requireAuth(req);

    if (auth instanceof NextResponse) {
      return auth;
    }

    if (!auth) {
      return NextResponse.json(
        {
          ok: false,
          message: "No autorizado",
          data: null,
        },
        { status: 401 },
      );
    }

    return handler(req, auth);
  };
}

export function withOptionalAuth(
  handler: (req: NextRequest, session: SessionData | null) => Promise<NextResponse>,
) {
  return async (req: NextRequest) => {
    const session = await getSession(req);
    return handler(req, session);
  };
}