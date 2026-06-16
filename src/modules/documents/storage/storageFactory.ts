import type { DocumentStorage, StorageConfig } from "./documentStorage";
import { createLocalStorage } from "./localStorage";

export function createDocumentStorage(config?: StorageConfig): DocumentStorage {
  const provider = config?.provider ?? (process.env.DOCUMENT_STORAGE_PROVIDER as StorageConfig["provider"]) ?? "local";

  switch (provider) {
    case "local":
      return createLocalStorage({
        provider: "local",
        localPath: config?.localPath ?? process.env.DOCUMENT_STORAGE_LOCAL_PATH,
        baseUrl: config?.baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? process.env.DOCUMENT_STORAGE_BASE_URL,
      });
    case "vercel-blob":
    case "s3":
    case "r2":
      return createNotImplementedStorage(provider);
    default:
      return createLocalStorage({ provider: "local" });
  }
}

function createNotImplementedStorage(provider: string): DocumentStorage {
  const message = `El proveedor de almacenamiento "${provider}" no está implementado en esta versión.`;
  return {
    async uploadDocument() {
      return { ok: false as const, message };
    },
    async deleteDocument() {
      return { ok: false as const, message };
    },
    async getDocumentUrl() {
      return { ok: false as const, message };
    },
  };
}
