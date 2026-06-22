import type { KnowledgeItem } from "../domain/types";

export const patrimonyKnowledge: KnowledgeItem[] = [
  {
    id: "patrimony-source-of-funds",
    domain: "PATRIMONY",
    title: "Origen de fondos",
    summary: "Explicación documentada de la procedencia económica de los fondos usados para adquirir o recibir activos digitales.",
    tags: ["origen", "fondos", "respaldo", "cartola", "ahorros", "ingresos"],
    examples: ["Quiero justificar fondos", "Compré con ahorros", "Necesito respaldar origen"],
    version: "1.0",
  },
  {
    id: "patrimony-digital-wealth",
    domain: "PATRIMONY",
    title: "Patrimonio digital",
    summary: "Conjunto de activos digitales, plataformas, direcciones, documentos y eventos vinculados al usuario.",
    tags: ["patrimonio", "activos digitales", "portafolio", "mapa patrimonial"],
    examples: ["Quiero ordenar mi patrimonio", "Tengo activos en varias plataformas", "Necesito un mapa completo"],
    version: "1.0",
  },
];
