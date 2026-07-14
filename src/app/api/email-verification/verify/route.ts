export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/emails/welcome";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { parseEmailVerificationIdentifier } from "@/modules/identity/application/emailVerification";
import {
  readOneTimeToken,
  revokeOneTimeToken,
} from "@/modules/identity/infrastructure/oneTimeTokenRepository";

function resolveApplicationUrl(req: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    req.nextUrl.origin
  ).replace(/\/$/, "");
}

function redirectToResult(req: NextRequest, status: "success" | "invalid") {
  const url = new URL("/verificar-correo", resolveApplicationUrl(req));
  url.searchParams.set("status", status);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token) return redirectToResult(req, "invalid");

  try {
    // El token solo se revoca después de guardar la verificación. Así, un
    // fallo transitorio de base de datos no destruye un enlace todavía válido.
    const record = await readOneTimeToken(token);
    if (!record) return redirectToResult(req, "invalid");

    const identity = parseEmailVerificationIdentifier(record.identifier);
    if (!identity) {
      await revokeOneTimeToken(token);
      return redirectToResult(req, "invalid");
    }

    const user = await prisma.users.findFirst({
      where: {
        id: identity.userId,
        email: identity.email,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        email_verified_at: true,
      },
    });

    if (!user) {
      await revokeOneTimeToken(token);
      return redirectToResult(req, "invalid");
    }

    // updateMany devuelve solo el conteo y evita que Prisma intente devolver
    // columnas antiguas que ya no existen en la base de datos de producción.
    const verificationUpdate = user.email_verified_at
      ? { count: 0 }
      : await prisma.users.updateMany({
          where: {
            id: user.id,
            email: identity.email,
            email_verified_at: null,
          },
          data: {
            email_verified_at: new Date(),
            updated_at: new Date(),
          },
        });

    const newlyVerified = verificationUpdate.count === 1;

    try {
      await revokeOneTimeToken(token);
    } catch (revokeError) {
      console.warn("[email-verification/verify] Token revocation failed:", revokeError);
    }

    if (newlyVerified) {
      try {
        await recordAuditEvent({
          userId: user.id,
          category: "SECURITY",
          severity: "INFO",
          event: "email_verified",
          description: "Correo electrónico verificado",
          result: "SUCCESS",
          entityType: "User",
          entityId: user.id,
          metadata: { source: "email-verification" },
          ipAddress: req.ip ?? req.headers.get("x-forwarded-for") ?? null,
          userAgent: req.headers.get("user-agent") ?? null,
        });
      } catch (auditError) {
        console.warn("[email-verification/verify] Audit event failed:", auditError);
      }

      try {
        await sendWelcomeEmail({
          to: user.email,
          fullName: user.full_name,
          role: user.role,
        });
      } catch (emailError) {
        console.warn("[email-verification/verify] Welcome email failed:", emailError);
      }
    }

    return redirectToResult(req, "success");
  } catch (error) {
    console.error("[api/email-verification/verify]", error);
    return redirectToResult(req, "invalid");
  }
}
