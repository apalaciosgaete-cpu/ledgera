import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PROFESSIONAL_PERMISSIONS,
  ProfessionalAccessStatus,
  ProfessionalWorkflowStatus,
  type ProfessionalPermission,
  type ProfessionalWorkflowStatus as ProfessionalWorkflowStatusValue,
} from "@/modules/professional/domain/clientAccess";

export async function countOccupiedProfessionalSeats(
  professionalUserId: string,
): Promise<number> {
  return prisma.professionalClientAccess.count({
    where: {
      professionalUserId,
      status: {
        in: [
          ProfessionalAccessStatus.PENDING,
          ProfessionalAccessStatus.ACTIVE,
        ],
      },
    },
  });
}

export async function listProfessionalClients(professionalUserId: string) {
  return prisma.professionalClientAccess.findMany({
    where: { professionalUserId },
    orderBy: [{ status: "asc" }, { workflowUpdatedAt: "desc" }],
    select: {
      id: true,
      clientUserId: true,
      status: true,
      permissions: true,
      workflowStatus: true,
      workflowNote: true,
      workflowUpdatedAt: true,
      invitedAt: true,
      acceptedAt: true,
      revokedAt: true,
      updatedAt: true,
      client: {
        select: {
          id: true,
          email: true,
          full_name: true,
          rut: true,
          status: true,
        },
      },
    },
  });
}

export async function listClientProfessionalInvitations(clientUserId: string) {
  return prisma.professionalClientAccess.findMany({
    where: { clientUserId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      professionalUserId: true,
      status: true,
      permissions: true,
      workflowStatus: true,
      invitedAt: true,
      acceptedAt: true,
      revokedAt: true,
      updatedAt: true,
      professional: {
        select: {
          id: true,
          email: true,
          full_name: true,
          status: true,
          twoFactorEnabled: true,
        },
      },
    },
  });
}

export async function createOrRenewProfessionalInvitation(input: {
  professionalUserId: string;
  clientUserId: string;
  permissions?: ProfessionalPermission[];
}) {
  const now = new Date();
  const permissions = input.permissions ?? DEFAULT_PROFESSIONAL_PERMISSIONS;

  return prisma.professionalClientAccess.upsert({
    where: {
      professionalUserId_clientUserId: {
        professionalUserId: input.professionalUserId,
        clientUserId: input.clientUserId,
      },
    },
    update: {
      status: ProfessionalAccessStatus.PENDING,
      permissions,
      workflowStatus: ProfessionalWorkflowStatus.INVITED,
      workflowNote: null,
      workflowUpdatedAt: now,
      invitedAt: now,
      acceptedAt: null,
      revokedAt: null,
      updatedAt: now,
    },
    create: {
      professionalUserId: input.professionalUserId,
      clientUserId: input.clientUserId,
      status: ProfessionalAccessStatus.PENDING,
      permissions,
      workflowStatus: ProfessionalWorkflowStatus.INVITED,
      workflowUpdatedAt: now,
      invitedAt: now,
    },
  });
}

export async function acceptProfessionalInvitation(input: {
  id: string;
  clientUserId: string;
}) {
  const now = new Date();

  return prisma.professionalClientAccess.updateMany({
    where: {
      id: input.id,
      clientUserId: input.clientUserId,
      status: ProfessionalAccessStatus.PENDING,
    },
    data: {
      status: ProfessionalAccessStatus.ACTIVE,
      workflowStatus: ProfessionalWorkflowStatus.DATA_PENDING,
      workflowNote: null,
      workflowUpdatedAt: now,
      acceptedAt: now,
      revokedAt: null,
      updatedAt: now,
    },
  });
}

export async function declineProfessionalInvitation(input: {
  id: string;
  clientUserId: string;
}) {
  const now = new Date();

  return prisma.professionalClientAccess.updateMany({
    where: {
      id: input.id,
      clientUserId: input.clientUserId,
      status: ProfessionalAccessStatus.PENDING,
    },
    data: {
      status: ProfessionalAccessStatus.DECLINED,
      workflowStatus: ProfessionalWorkflowStatus.BLOCKED,
      workflowNote: "Invitación rechazada por el cliente.",
      workflowUpdatedAt: now,
      updatedAt: now,
    },
  });
}

export async function revokeProfessionalClientAccess(input: {
  professionalUserId: string;
  clientUserId: string;
}) {
  const now = new Date();

  return prisma.professionalClientAccess.updateMany({
    where: {
      professionalUserId: input.professionalUserId,
      clientUserId: input.clientUserId,
      status: {
        in: [
          ProfessionalAccessStatus.PENDING,
          ProfessionalAccessStatus.ACTIVE,
        ],
      },
    },
    data: {
      status: ProfessionalAccessStatus.REVOKED,
      workflowStatus: ProfessionalWorkflowStatus.BLOCKED,
      workflowNote: "Acceso revocado por el profesional.",
      workflowUpdatedAt: now,
      revokedAt: now,
      updatedAt: now,
    },
  });
}

export async function revokeProfessionalAccessAsClient(input: {
  id: string;
  clientUserId: string;
}) {
  const now = new Date();

  return prisma.professionalClientAccess.updateMany({
    where: {
      id: input.id,
      clientUserId: input.clientUserId,
      status: ProfessionalAccessStatus.ACTIVE,
    },
    data: {
      status: ProfessionalAccessStatus.REVOKED,
      workflowStatus: ProfessionalWorkflowStatus.BLOCKED,
      workflowNote: "Acceso revocado por el cliente.",
      workflowUpdatedAt: now,
      revokedAt: now,
      updatedAt: now,
    },
  });
}

export async function updateProfessionalClientWorkflow(input: {
  professionalUserId: string;
  clientUserId: string;
  workflowStatus: ProfessionalWorkflowStatusValue;
  workflowNote: string | null;
}) {
  const now = new Date();

  return prisma.professionalClientAccess.updateMany({
    where: {
      professionalUserId: input.professionalUserId,
      clientUserId: input.clientUserId,
      status: ProfessionalAccessStatus.ACTIVE,
    },
    data: {
      workflowStatus: input.workflowStatus,
      workflowNote: input.workflowNote,
      workflowUpdatedAt: now,
      updatedAt: now,
    },
  });
}

export async function getActiveProfessionalClientAccess(input: {
  professionalUserId: string;
  clientUserId: string;
}) {
  return prisma.professionalClientAccess.findFirst({
    where: {
      professionalUserId: input.professionalUserId,
      clientUserId: input.clientUserId,
      status: ProfessionalAccessStatus.ACTIVE,
    },
    select: {
      id: true,
      permissions: true,
      acceptedAt: true,
      workflowStatus: true,
      workflowNote: true,
      workflowUpdatedAt: true,
    },
  });
}
