export type LegalDomain = "RENTA" | "IVA" | "CODIGO_TRIBUTARIO" | "SII_CRITERIA" | "COMPLIANCE";

export type LegalSource = {
  id: string;
  domain: LegalDomain;
  title: string;
  authority: string;
  sourceType: "LAW" | "ADMIN_CRITERIA" | "PROCESS" | "PRINCIPLE";
  summary: string;
  appliesTo: string[];
  riskNotes: string[];
  version: string;
};

export type LegalMatch = {
  source: LegalSource;
  score: number;
  matchedTerms: string[];
};

export type LegalClassification = {
  query: string;
  domains: LegalDomain[];
  matches: LegalMatch[];
  primary: LegalSource | null;
  disclaimer: string;
};
