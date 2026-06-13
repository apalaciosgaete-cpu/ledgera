import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const domain = readFileSync("src/modules/tax/domain/dte.ts", "utf8");
const service = readFileSync("src/modules/tax/application/createTaxDocumentDraft.ts", "utf8");
const repository = readFileSync("src/modules/tax/infrastructure/taxDocumentRepository.ts", "utf8");
const route = readFileSync("src/app/api/tax/documents/route.ts", "utf8");
const prismaSchema = readFileSync("prisma/schema.prisma", "utf8");

test("tax document domain defines document types", () => {
  assert.match(domain, /BOLETA_ELECTRONICA/);
  assert.match(domain, /FACTURA_ELECTRONICA/);
  assert.match(domain, /NOTA_CREDITO/);
  assert.match(domain, /NOTA_DEBITO/);
});

test("tax document domain defines status lifecycle", () => {
  assert.match(domain, /DRAFT/);
  assert.match(domain, /READY_TO_SEND/);
  assert.match(domain, /ACCEPTED/);
  assert.match(domain, /REJECTED/);
  assert.match(domain, /VOIDED/);
});

test("tax document domain calculates totals and builds XML placeholder", () => {
  assert.match(domain, /IVA_RATE = 0\.19/);
  assert.match(domain, /calculateDteAmounts/);
  assert.match(domain, /buildDteXmlPlaceholder/);
});

test("tax document service requires validated tax profile", () => {
  assert.match(service, /getTaxProfileByUserId/);
  assert.match(service, /isValidated/);
  assert.match(service, /tax_document_draft_created/);
});

test("tax document repository persists drafts", () => {
  assert.match(repository, /tax_documents/);
  assert.match(repository, /createTaxDocumentDraft/);
  assert.match(repository, /listTaxDocumentsByUserId/);
});

test("tax document API is authenticated", () => {
  assert.match(route, /requireAuth/);
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
});

test("Prisma schema includes TaxDocument model", () => {
  assert.match(prismaSchema, /model TaxDocument/);
  assert.match(prismaSchema, /tax_documents/);
});

test("tax document migration SQL exists", () => {
  const migrations = readdirSync(path.join(process.cwd(), "prisma/migrations"));
  const documentMigration = migrations.find((m) => m.includes("tax_documents"));

  assert.ok(documentMigration, "No se encontró migración de tax_documents");

  const source = readFileSync(
    path.join(process.cwd(), "prisma/migrations", documentMigration, "migration.sql"),
    "utf8",
  );

  assert.match(source, /tax_documents/);
});
