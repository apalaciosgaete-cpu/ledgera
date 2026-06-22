export type KnowledgeDomain = "ASSET" | "PLATFORM" | "CUSTODY" | "TAX" | "PATRIMONY" | "DOCUMENT";

export type KnowledgeItem = {
  id: string;
  domain: KnowledgeDomain;
  title: string;
  summary: string;
  tags: string[];
  examples: string[];
  version: string;
};

export type KnowledgeResult = {
  item: KnowledgeItem;
  score: number;
  tags: string[];
};

export type KnowledgeClassification = {
  query: string;
  domains: KnowledgeDomain[];
  results: KnowledgeResult[];
  primary: KnowledgeItem | null;
};
