export interface UploadStorageInput {
  key: string;
  data: Buffer;
  contentType: string;
}

export interface DocumentStorage {
  uploadDocument(input: UploadStorageInput): Promise<{ ok: true; url?: string } | { ok: false; message: string }>;
  deleteDocument(key: string): Promise<{ ok: true } | { ok: false; message: string }>;
  getDocumentUrl(key: string): Promise<{ ok: true; url: string } | { ok: false; message: string }>;
}

export interface StorageConfig {
  provider: "local" | "vercel-blob" | "s3" | "r2";
  localPath?: string;
  baseUrl?: string;
}
