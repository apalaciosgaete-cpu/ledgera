import { knowledgeCatalog } from "../catalogs";
import type { KnowledgeClassification, KnowledgeDomain, KnowledgeItem, KnowledgeResult } from "../domain/types";

function normalize(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreItem(query: string, item: KnowledgeItem): KnowledgeResult | null {
  const normalizedQuery = normalize(query);
  const matchedTags = item.tags.filter((tag) => normalizedQuery.includes(normalize(tag)));
  const titleMatch = normalizedQuery.includes(normalize(item.title));
  const exampleMatch = item.examples.some((example) => normalizedQuery.includes(normalize(example)));
  const score = matchedTags.length * 2 + (titleMatch ? 3 : 0) + (exampleMatch ? 2 : 0);

  if (score <= 0) return null;
  return { item, score, tags: matchedTags };
}

export function classifyKnowledge(query: string): KnowledgeClassification {
  const results = knowledgeCatalog
    .map((item) => scoreItem(query, item))
    .filter((item): item is KnowledgeResult => Boolean(item))
    .sort((a, b) => b.score - a.score);

  const domains = Array.from(new Set(results.map((result) => result.item.domain))) as KnowledgeDomain[];

  return {
    query,
    domains,
    results,
    primary: results[0]?.item ?? null,
  };
}

export function getKnowledgeByDomain(domain: KnowledgeDomain) {
  return knowledgeCatalog.filter((item) => item.domain === domain);
}

export function getKnowledgeById(id: string) {
  return knowledgeCatalog.find((item) => item.id === id) ?? null;
}
