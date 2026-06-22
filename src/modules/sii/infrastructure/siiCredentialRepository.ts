import { prisma } from "@/lib/prisma";
import type { SiiCredential, SiiEnvironment } from "@/modules/sii/domain/sii";

export async function getActiveCredential(
  environment: SiiEnvironment,
  issuerRut: string,
): Promise<SiiCredential | null> {
  const row = await prisma.siiCredential.findFirst({
    where: { environment, issuerRut, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return row ? mapCredential(row) : null;
}

export async function createCredential(input: {
  environment: SiiEnvironment;
  issuerRut: string;
  certificateName: string;
  certificatePath?: string | null;
  certificateExpires?: Date | null;
}): Promise<SiiCredential> {
  const row = await prisma.siiCredential.create({
    data: {
      environment: input.environment,
      issuerRut: input.issuerRut,
      certificateName: input.certificateName,
      certificatePath: input.certificatePath ?? null,
      certificateExpires: input.certificateExpires ?? null,
      isActive: true,
    },
  });

  return mapCredential(row);
}

export async function listCredentials(): Promise<SiiCredential[]> {
  const rows = await prisma.siiCredential.findMany({
    orderBy: { createdAt: "desc" },
  });

  return rows.map(mapCredential);
}

function mapCredential(row: {
  id: string;
  environment: string;
  issuerRut: string;
  certificateName: string;
  certificatePath: string | null;
  certificateExpires: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SiiCredential {
  return {
    id: row.id,
    environment: row.environment as SiiEnvironment,
    issuerRut: row.issuerRut,
    certificateName: row.certificateName,
    certificatePath: row.certificatePath,
    certificateExpires: row.certificateExpires,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
