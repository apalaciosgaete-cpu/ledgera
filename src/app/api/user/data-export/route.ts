// src/app/api/user/data-export/route.ts
// Derecho de portabilidad (Ley 21.719, Art. 11): el titular descarga sus datos
// personales en un formato estructurado, de uso común y legible por máquina (JSON).
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";

function fail(message: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, message, data: null }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return fail("No autorizado.", 401);

  const userId = auth.user.id;
  const user = await getUserById(userId);
  if (!user) return fail("Usuario no encontrado.", 404);

  // Datos de identificación (se excluyen secretos: password_hash, semilla 2FA).
  const profile = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    rut: user.rut ?? null,
    phone: user.phone ?? null,
    address: user.address ?? null,
    commune: user.commune ?? null,
    country: user.country ?? null,
    role: user.role,
    subscriptionPlan: user.subscriptionPlan ?? null,
    twoFactorEnabled: user.twoFactorEnabled ?? false,
  };

  // Datos financieros/tributarios y de uso asociados al titular.
  const [
    portfolioMovements,
    taxEvents,
    taxDeclarations,
    bankMovements,
    billingPayments,
    exchangeConnections,
  ] = await Promise.all([
    prisma.portfolioMovement.findMany({ where: { userId } }).catch(() => []),
    prisma.taxEvent.findMany({ where: { userId } }).catch(() => []),
    prisma.taxDeclaration.findMany({ where: { userId } }).catch(() => []),
    prisma.bankMovement.findMany({ where: { userId } }).catch(() => []),
    prisma.billingPayment.findMany({ where: { userId } }).catch(() => []),
    prisma.exchangeConnection.findMany({ where: { userId } }).catch(() => []),
  ]);

  // Las conexiones de exchange se exponen SIN las credenciales cifradas.
  const exchangeConnectionsSafe = (exchangeConnections as Array<Record<string, unknown>>).map(
    (conn) => {
      const copy = { ...conn };
      delete copy.apiKeyEncrypted;
      delete copy.apiSecretEncrypted;
      return copy;
    },
  );

  const payload = {
    exportedAt: new Date().toISOString(),
    legalBasis: "Ley N° 21.719, Art. 11 — derecho de portabilidad",
    subject: profile,
    data: {
      portfolioMovements,
      taxEvents,
      taxDeclarations,
      bankMovements,
      billingPayments,
      exchangeConnections: exchangeConnectionsSafe,
    },
  };

  const filename = `ledgera-datos-${userId}-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
