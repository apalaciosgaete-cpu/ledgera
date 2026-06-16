import fs from "node:fs/promises";
import path from "node:path";
import type { DocumentStorage, StorageConfig, UploadStorageInput } from "./documentStorage";

export function createLocalStorage(config: StorageConfig): DocumentStorage {
  const baseDir = config.localPath ?? path.join(process.cwd(), "uploads");

  async function ensureDir() {
    await fs.mkdir(baseDir, { recursive: true });
  }

  return {
    async uploadDocument(input: UploadStorageInput) {
      try {
        await ensureDir();
        const filePath = path.join(baseDir, input.key);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, input.data);
        return { ok: true as const };
      } catch (error) {
        console.error("[localStorage/upload]", error);
        return { ok: false as const, message: "Error al guardar el archivo localmente." };
      }
    },

    async deleteDocument(key: string) {
      try {
        const filePath = path.join(baseDir, key);
        await fs.unlink(filePath);
        return { ok: true as const };
      } catch {
        // Ignorar errores si el archivo no existe
        return { ok: true as const };
      }
    },

    async getDocumentUrl(key: string) {
      const baseUrl = config.baseUrl?.replace(/\/$/, "") ?? "";
      return { ok: true as const, url: `${baseUrl}/api/documents/${key}/download` };
    },
  };
}
