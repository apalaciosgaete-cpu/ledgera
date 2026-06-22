import { listUserTaxMemoryPatterns } from "@/modules/tax-memory/infrastructure/taxMemoryRepository";

export async function getTaxMemory(userId: string) {
  try {
    const patterns = await listUserTaxMemoryPatterns(userId);
    return { ok: true as const, patterns };
  } catch (error) {
    console.error("[tax-memory/getTaxMemory]", error);
    return { ok: false as const, message: "No se pudo obtener la memoria tributaria." };
  }
}
