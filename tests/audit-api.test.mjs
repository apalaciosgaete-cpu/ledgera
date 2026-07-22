import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("Audit events API route supports GET with filters", () => {
  const source = read("src/app/api/audit/events/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /requireProfessionalClientAccess/);
  assert.match(source, /GET/);
  assert.match(source, /listAuditEvents/);
  assert.match(source, /category/);
  assert.match(source, /severity/);
  assert.match(source, /result/);
  assert.match(source, /dateFrom/);
  assert.match(source, /dateTo/);
});

test("Audit event detail API route exists", () => {
  const source = read("src/app/api/audit/events/[id]/route.ts");

  assert.match(source, /getSessionFromRequest/);
  assert.match(source, /getAuditEventById/);
  assert.match(source, /GET/);
});

test("Prisma schema includes AuditEvent model", () => {
  const source = read("prisma/schema.prisma");

  assert.match(source, /model AuditEvent/);
  assert.match(source, /audit_events/);
});

test("Audit events migration SQL exists", () => {
  const migrations = fs.readdirSync(path.join(root, "prisma/migrations"));
  const auditMigration = migrations.find((m) => m.includes("add_audit_events"));

  assert.ok(auditMigration, "No se encontró migración de auditoría");

  const source = read(`prisma/migrations/${auditMigration}/migration.sql`);

  assert.match(source, /CREATE TABLE "audit_events"/);
  assert.match(source, /"user_id"/);
  assert.match(source, /"actor_id"/);
});
