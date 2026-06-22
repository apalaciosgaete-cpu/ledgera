export type DocumentCategory =
  | "TAX"
  | "DTE"
  | "SII"
  | "BILLING"
  | "AUDIT"
  | "TASK"
  | "REPORT"
  | "LEGAL"
  | "OTHER";

export type DocumentType =
  | "PDF"
  | "XML"
  | "CSV"
  | "XLSX"
  | "JSON"
  | "TXT"
  | "IMAGE";

export type DocumentStatus =
  | "ACTIVE"
  | "ARCHIVED"
  | "DELETED";

export interface Document {
  id: string;
  userId: string;
  category: DocumentCategory;
  type: DocumentType;
  status: DocumentStatus;
  name: string;
  description: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  checksum: string | null;
  tags: string[];
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  uploadedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentInput {
  userId: string;
  category: DocumentCategory;
  type: DocumentType;
  name: string;
  description?: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  checksum?: string | null;
  tags?: string[];
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  uploadedBy?: string | null;
}

export interface UpdateDocumentInput {
  name?: string;
  description?: string | null;
  tags?: string[];
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "TAX",
  "DTE",
  "SII",
  "BILLING",
  "AUDIT",
  "TASK",
  "REPORT",
  "LEGAL",
  "OTHER",
];

export const DOCUMENT_TYPES: DocumentType[] = [
  "PDF",
  "XML",
  "CSV",
  "XLSX",
  "JSON",
  "TXT",
  "IMAGE",
];

export const DOCUMENT_STATUSES: DocumentStatus[] = [
  "ACTIVE",
  "ARCHIVED",
  "DELETED",
];

export function isValidDocumentCategory(value: string): value is DocumentCategory {
  return DOCUMENT_CATEGORIES.includes(value as DocumentCategory);
}

export function isValidDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.includes(value as DocumentType);
}

export function isValidDocumentStatus(value: string): value is DocumentStatus {
  return DOCUMENT_STATUSES.includes(value as DocumentStatus);
}

export function documentTypeFromMimeType(mimeType: string): DocumentType {
  const type = mimeType.toLowerCase();
  if (type.includes("pdf")) return "PDF";
  if (type.includes("xml")) return "XML";
  if (type.includes("csv")) return "CSV";
  if (type.includes("excel") || type.includes("sheet") || type.includes("xlsx") || type.includes("xls")) return "XLSX";
  if (type.includes("json")) return "JSON";
  if (type.includes("text/plain")) return "TXT";
  if (type.startsWith("image/")) return "IMAGE";
  return "PDF";
}

export function documentTypeFromFileName(fileName: string): DocumentType {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "pdf":
      return "PDF";
    case "xml":
      return "XML";
    case "csv":
      return "CSV";
    case "xlsx":
    case "xls":
      return "XLSX";
    case "json":
      return "JSON";
    case "txt":
      return "TXT";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return "IMAGE";
    default:
      return "PDF";
  }
}
