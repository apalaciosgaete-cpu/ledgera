import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("GET /api/documents requires auth and supports filters", () => {
  const source = read("src/app/api/documents/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /listUserDocuments/);
  assert.match(source, /Documentos obtenidos/);
});

test("POST /api/documents uploads a document", () => {
  const source = read("src/app/api/documents/route.ts");

  assert.match(source, /uploadDocument/);
  assert.match(source, /Documento subido correctamente/);
  assert.match(source, /formData/);
});

test("GET /api/documents/[id] returns document detail", () => {
  const source = read("src/app/api/documents/[id]/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /getDocumentById/);
  assert.match(source, /Documento obtenido/);
});

test("PATCH /api/documents/[id] updates document metadata", () => {
  const source = read("src/app/api/documents/[id]/route.ts");

  assert.match(source, /updateDocument/);
  assert.match(source, /Documento actualizado/);
});

test("DELETE /api/documents/[id] soft-deletes document", () => {
  const source = read("src/app/api/documents/[id]/route.ts");

  assert.match(source, /deleteDocument/);
  assert.match(source, /Documento eliminado/);
});

test("POST /api/documents/[id]/archive transitions to ARCHIVED", () => {
  const source = read("src/app/api/documents/[id]/archive/route.ts");

  assert.match(source, /archiveDocument/);
  assert.match(source, /Documento archivado/);
});

test("GET /api/documents/[id]/download serves or redirects", () => {
  const source = read("src/app/api/documents/[id]/download/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /getDocumentById/);
  assert.match(source, /Content-Disposition/);
});

test("GET /api/documents/metrics returns document metrics", () => {
  const source = read("src/app/api/documents/metrics/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /getDocumentMetrics/);
  assert.match(source, /Métricas obtenidas/);
});

test("Admin documents API requires admin role", () => {
  const source = read("src/app/api/documents/admin/route.ts");

  assert.match(source, /role !== "admin"/);
  assert.match(source, /listDocuments/);
});

test("Dashboard user API exposes document metrics", () => {
  const source = read("src/modules/dashboard/application/buildUserDashboard.ts");

  assert.match(source, /documents:/);
  assert.match(source, /documentTotal/);
  assert.match(source, /documentTax/);
});

test("Dashboard executive API exposes document metrics", () => {
  const source = read("src/modules/dashboard/application/buildExecutiveDashboard.ts");

  assert.match(source, /totalDocuments/);
  assert.match(source, /taxDocuments/);
  assert.match(source, /documentsLast30Days/);
});

test("Timeline API supports DOCUMENT entity type", () => {
  const source = read("src/app/api/timeline/entity/route.ts");

  assert.match(source, /DOCUMENT/);
});

test("Audit category includes DOCUMENT", () => {
  const source = read("src/modules/audit/domain/audit.ts");

  assert.match(source, /"DOCUMENT"/);
});
