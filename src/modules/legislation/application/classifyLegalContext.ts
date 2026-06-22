import { legalCatalog } from "../catalogs";
import type { LegalClassification, LegalDomain, LegalMatch, LegalSource } from "../domain/types";

function normalize(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreSource(query: string, source: LegalSource): LegalMatch | null {
  const normalizedQuery = normalize(query);
  const matchedTerms = source.appliesTo.filter((term) => normalizedQuery.includes(normalize(term)));
  const titleMatch = normalizedQuery.includes(normalize(source.title));
  const score = matchedTerms.length * 2 + (titleMatch ? 3 : 0);

  if (score <= 0) return null;
  return { source, score, matchedTerms };
}

export function classifyLegalContext(query: string): LegalClassification {
  const matches = legalCatalog
    .map((source) => scoreSource(query, source))
    .filter((match): match is LegalMatch => Boolean(match))
    .sort((a, b) => b.score - a.score);

  const domains = Array.from(new Set(matches.map((match) => match.source.domain))) as LegalDomain[];

  return {
    query,
    domains,
    matches,
    primary: matches[0]?.source ?? null,
    disclaimer: "LEDGERA entrega análisis informativo. La decisión y validación final corresponde al usuario o a su asesor profesional.",
  };
}

export function getLegalSourcesByDomain(domain: LegalDomain) {
  return legalCatalog.filter((source) => source.domain === domain);
}

export function getLegalSourceById(id: string) {
  return legalCatalog.find((source) => source.id === id) ?? null;
}
