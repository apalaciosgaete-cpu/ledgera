import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("root metadata does not force the homepage canonical on every route", () => {
  const layout = read("src/app/layout.tsx");
  assert.doesNotMatch(layout, /alternates:\s*\{\s*canonical:\s*baseUrl/);
  assert.match(layout, /template:\s*"%s \| LEDGERA"/);
});

test("SEO landing pages use distinct editorial sections", () => {
  const content = read("src/modules/seo/seoPageContent.ts");
  assert.doesNotMatch(content, /const commonSections/);
  assert.match(content, /Qué operaciones conviene identificar antes de revisar impuestos/);
  assert.match(content, /Qué archivos de Binance necesitas/);
  assert.match(content, /1\. Reúne el período completo/);
  assert.match(content, /Qué necesita un profesional para revisar bien/);
});

test("blog articles do not share a generic body", () => {
  const articles = read("src/modules/seo/blogArticles.ts");
  assert.doesNotMatch(articles, /const baseSections/);
  assert.match(articles, /const declarationSections/);
  assert.match(articles, /const auditSections/);
  assert.match(articles, /const taxpayerProfileSections/);
  assert.match(articles, /const importSections/);
});

test("robots is indexable by default and protects private surfaces", () => {
  const robots = read("src/app/robots.ts");
  assert.match(robots, /SITE_MAINTENANCE_MODE === "true"/);
  assert.match(robots, /"\/api\/"/);
  assert.match(robots, /"\/panel"/);
  assert.match(robots, /sitemap: `\$\{baseUrl\}\/sitemap\.xml`/);
});

test("public content exposes official SII references", () => {
  const pages = read("src/modules/seo/seoPageContent.ts");
  const articles = read("src/app/blog/[slug]/page.tsx");
  assert.match(pages, /sii\.cl\/preguntas_frecuentes\/criptomonedas/);
  assert.match(articles, /Fuentes oficiales/);
  assert.match(articles, /Equipo editorial LEDGERA/);
});
