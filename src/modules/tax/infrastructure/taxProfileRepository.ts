import { prisma } from "@/lib/prisma";
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

  return mapTaxProfile(profile);
}
