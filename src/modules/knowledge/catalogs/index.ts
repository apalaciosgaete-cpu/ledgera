import type { KnowledgeItem } from "../domain/types";
import { assetKnowledge } from "./assets";
import { platformKnowledge } from "./platforms";
import { custodyKnowledge } from "./custody";
import { taxEventKnowledge } from "./taxEvents";
import { patrimonyKnowledge } from "./patrimony";
import { documentKnowledge } from "./documents";

export const knowledgeCatalog: KnowledgeItem[] = [
  ...assetKnowledge,
  ...platformKnowledge,
  ...custodyKnowledge,
  ...taxEventKnowledge,
  ...patrimonyKnowledge,
  ...documentKnowledge,
];

export { assetKnowledge, platformKnowledge, custodyKnowledge, taxEventKnowledge, patrimonyKnowledge, documentKnowledge };
