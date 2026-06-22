import type { KnowledgeItem } from "../domain/types";

export const documentKnowledge: KnowledgeItem[] = [
  {
    id: "doc-exchange-csv",
    domain: "DOCUMENT",
    title: "CSV de plataforma",
    summary: "Archivo exportado desde una plataforma con historial de operaciones, depósitos, retiros y movimientos.",
    tags: ["csv", "historial", "reporte", "exportacion", "movimientos"],
    examples: ["Subí CSV", "Tengo historial exportado", "Descargué reporte"],
    version: "1.0",
  },
  {
    id: "doc-bank-statement",
    domain: "DOCUMENT",
    title: "Cartola bancaria",
    summary: "Documento bancario usado para respaldar transferencias, entradas, salidas y origen de fondos.",
    tags: ["cartola", "banco", "transferencia", "respaldo bancario"],
    examples: ["Tengo cartola", "Transferí desde banco", "Necesito respaldar depósito"],
    version: "1.0",
  },
  {
    id: "doc-proof",
    domain: "DOCUMENT",
    title: "Respaldo de custodia",
    summary: "Evidencia asociada a una dirección, dispositivo o cuenta declarada por el usuario.",
    tags: ["respaldo", "proof", "direccion", "captura", "comprobante"],
    examples: ["Tengo captura", "Necesito probar dirección", "Guardar comprobante"],
    version: "1.0",
  },
];
