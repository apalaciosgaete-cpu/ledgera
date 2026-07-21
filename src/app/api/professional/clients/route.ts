import { NextRequest, NextResponse } from "next/server";

import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { getUserByEmail } from "@/modules/identity/infrastructure/userRepository";
import { getProfessionalSeatEntitlement } from "@/modules/professional/application/getProfessionalSeatEntitlement";
import {
  ProfessionalAccessStatus,
  normalizeProfessionalPermissions,
} from "@/modules/professional/domain/clientAccess";
import { professionalExtraClientPrice } from "@/modules/professional/domain/professionalSeatBilling";
import {
  countOccupiedProfessionalSeats,
  createOrRenewProfessionalInvitation,
  listProfessionalClients,
} from "@/modules/professional/infrastructure/professionalClientAccessRepository";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { requireFeatureAccess } from "@/modules/subscription/application/requireFeatureAccess";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";

export const dynamic = "force-dynamic";

function requireProfessionalSecurity(user: {
  id: string;
  role?: string | null;
  status?: string | null;
  subscriptionPlan?: string | null;
  subscriptionExpiresAt?: Date | string | null;
  twoFactorEnabled?: boolean | null;
}) {
  const featureAccess = requireFeatureAccess(user, Feature.EXPERT_MODE);
  if (!featureAccess.ok) return featureAccess.response;

  if (!user.twoFactorEnabled && user.role !== "admin") {
    return NextResponse.json(
      {
        ok: false,
        message: "Debes activar la autenticación de dos factores para administrar clientes.",
        data: { code: "TWO_FACTOR_REQUIRED" },
      },
      { status: 403 },
    );
  }

  return null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  const securityResponse = requireProfessionalSecurity(auth.user);
  if (securityResponse) return securityResponse;

  try {
    const [clients, seatEntitlement] = await Promise.all([
      listProfessionalClients(auth.user.id),
      getProfessionalSeatEntitlement(auth.user.id),
    ]);
    const occupiedSeats = clients.filter((item) =>
      item.status === ProfessionalAccessStatus.PENDING ||
      item.status === ProfessionalAccessStatus.ACTIVE,
    ).length;

    return ok({
      ...seatEntitlement,
      occupiedSeats,
      availableSeats: Math.max(seatEntitlement.totalSeats - occupiedSeats, 0),
      extraSeatPrice: professionalExtraClientPrice,
      clients: clients.map((item) => ({
        id: item.id,
        clientUserId: item.clientUserId,
        status: item.status,
        permissions: normalizeProfessionalPermissions(item.permissions),
        workflowStatus: item.workflowStatus,
        workflowNote: item.workflowNote,
        workflowUpdatedAt: item.workflowUpdatedAt,
        invitedAt: item.invitedAt,
        acceptedAt: item.acceptedAt,
        revokedAt: item.revokedAt,
        updatedAt: item.updatedAt,
        client: {
          id: item.client.id,
          email: item.client.email,
          fullName: item.client.full_name,
          rut: item.client.rut,
          status: item.client.status,
        },
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const csrfResponse = enforceCsrfProtection(request);
  if (csrfResponse) return csrfResponse;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  const securityResponse = requireProfessionalSecurity(auth.user);
  if (securityResponse) return securityResponse;

  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const permissions = normalizeProfessionalPermissions(body.permissions);

    if (!email) return fail("Debes indicar el correo del cliente.", 400);

    const targetUser = await getUserByEmail(email);
    if (!targetUser) {
      return fail("El cliente debe crear una cuenta LEDGERA antes de recibir acceso profesional.", 404);
    }

    if (targetUser.id === auth.user.id) {
      return fail("No puedes invitar tu propia cuenta como cliente.", 400);
    }

    if (targetUser.status !== "active") {
      return fail("La cuenta del cliente no está activa.", 409);
    }

    const currentClients = await listProfessionalClients(auth.user.id);
    const existing = currentClients.find(
      (item) => item.clientUserId === targetUser.id,
    );

    if (
      existing?.status === ProfessionalAccessStatus.PENDING ||
      existing?.status === ProfessionalAccessStatus.ACTIVE
    ) {
      return fail("El cliente ya tiene una invitación o mandato activo.", 409);
    }

    const [occupiedSeats, seatEntitlement] = await Promise.all([
      countOccupiedProfessionalSeats(auth.user.id),
      getProfessionalSeatEntitlement(auth.user.id),
    ]);

    if (occupiedSeats >= seatEntitlement.totalSeats) {
      return NextResponse.json(
        {
          ok: false,
          message: `Tienes ${seatEntitlement.totalSeats} cupos disponibles: ${seatEntitlement.includedSeats} incluidos y ${seatEntitlement.purchasedSeats} adicionales. Libera un cupo o contrata otro cliente adicional.`,
          data: {
            code: "PROFESSIONAL_CLIENT_LIMIT",
            includedSeats: seatEntitlement.includedSeats,
            purchasedSeats: seatEntitlement.purchasedSeats,
            totalSeats: seatEntitlement.totalSeats,
            occupiedSeats,
            extraSeatPrice: professionalExtraClientPrice,
          },
        },
        { status: 409 },
      );
    }

    const invitation = await createOrRenewProfessionalInvitation({
      professionalUserId: auth.user.id,
      clientUserId: targetUser.id,
      permissions,
    });

    await createAdminAuditLog({
      action: "PROFESSIONAL_CLIENT_INVITED",
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      ...getAuditRequestContext(request),
      metadata: {
        mandateId: invitation.id,
        permissions,
        workflowStatus: invitation.workflowStatus,
        occupiedSeatsBeforeInvitation: occupiedSeats,
        totalSeats: seatEntitlement.totalSeats,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Invitación profesional creada. El cliente debe aceptarla desde su cuenta.",
        data: {
          id: invitation.id,
          clientUserId: targetUser.id,
          clientEmail: targetUser.email,
          status: invitation.status,
          workflowStatus: invitation.workflowStatus,
          permissions,
          seats: {
            includedSeats: seatEntitlement.includedSeats,
            purchasedSeats: seatEntitlement.purchasedSeats,
            totalSeats: seatEntitlement.totalSeats,
            occupiedSeats: occupiedSeats + 1,
            availableSeats: Math.max(seatEntitlement.totalSeats - occupiedSeats - 1, 0),
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return serverError(error);
  }
}
