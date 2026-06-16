import { prisma } from "@/lib/prisma";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";
import type {
  CreateTaxProfileInput,
  TaxProfile,
  UpdateTaxProfileInput,
} from "@/modules/tax/domain/taxProfile";

function mapTaxProfile(row: {
  id: string;
  userId: string;
  documentType: string;
  rut: string;
  legalName: string;
  businessActivity: string | null;
  address: string;
  commune: string;
  city: string;
  dteEmail: string;
  isValidated: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TaxProfile {
  return {
    id: row.id,
    userId: row.userId,
    documentType: row.documentType as TaxProfile["documentType"],
    rut: row.rut,
    legalName: row.legalName,
    businessActivity: row.businessActivity,
    address: row.address,
    commune: row.commune,
    city: row.city,
    dteEmail: row.dteEmail,
    isValidated: row.isValidated,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getTaxProfileByUserId(
  userId: string,
): Promise<TaxProfile | null> {
  const profile = await prisma.taxProfile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  return mapTaxProfile(profile);
}

export async function upsertTaxProfile(
  input: CreateTaxProfileInput | UpdateTaxProfileInput,
): Promise<TaxProfile> {
  const existing = await prisma.taxProfile.findUnique({
    where: { userId: input.userId },
    select: { id: true, isValidated: true },
  });

  const profile = await prisma.taxProfile.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      documentType: input.documentType,
      rut: input.rut,
      legalName: input.legalName,
      businessActivity: input.businessActivity ?? null,
      address: input.address,
      commune: input.commune,
      city: input.city,
      dteEmail: input.dteEmail,
      isValidated: true,
    },
    update: {
      documentType: input.documentType,
      rut: input.rut,
      legalName: input.legalName,
      businessActivity: input.businessActivity ?? null,
      address: input.address,
      commune: input.commune,
      city: input.city,
      dteEmail: input.dteEmail,
      isValidated: true,
    },
  });

  const isNew = !existing;
  const wasValidated = existing?.isValidated ?? false;

  if (isNew) {
    await recordTimelineEvent({
      userId: input.userId,
      category: "PROFILE",
      severity: "INFO",
      title: "Perfil tributario creado",
      description: `Se creó el perfil tributario para ${input.legalName} (${input.rut}).`,
      entityType: "TaxProfile",
      entityId: profile.id,
      metadata: { documentType: input.documentType, rut: input.rut },
    });
  } else {
    await recordTimelineEvent({
      userId: input.userId,
      category: "PROFILE",
      severity: "INFO",
      title: "Perfil tributario actualizado",
      description: `Se actualizó la información del perfil tributario (${input.rut}).`,
      entityType: "TaxProfile",
      entityId: profile.id,
      metadata: { documentType: input.documentType, rut: input.rut },
    });
  }

  if (!wasValidated && profile.isValidated) {
    await recordTimelineEvent({
      userId: input.userId,
      category: "PROFILE",
      severity: "SUCCESS",
      title: "Perfil tributario validado",
      description: `El perfil tributario de ${input.legalName} fue validado correctamente.`,
      entityType: "TaxProfile",
      entityId: profile.id,
      metadata: { documentType: input.documentType, rut: input.rut },
    });
  }

  return mapTaxProfile(profile);
}
