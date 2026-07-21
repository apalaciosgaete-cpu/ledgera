import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const migrationsDirectory = resolve(process.cwd(), "prisma/migrations");
const baselineCutoff = "20260713010000_remove_unused_domains";
const recoverableFailedMigration = "20260613000000_add_smart_tax_scores";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

function runPrisma(args, { capture = false } = {}) {
  return spawnSync(npxCommand, ["prisma", ...args], {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  });
}

function printCaptured(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

function outputOf(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function migrationDirectories() {
  if (!existsSync(migrationsDirectory)) {
    throw new Error("No existe prisma/migrations.");
  }

  return readdirSync(migrationsDirectory)
    .filter((entry) => {
      const fullPath = resolve(migrationsDirectory, entry);
      return statSync(fullPath).isDirectory() &&
        existsSync(resolve(fullPath, "migration.sql"));
    })
    .sort();
}

function baselineExistingDatabase() {
  const migrations = migrationDirectories();
  const cutoffIndex = migrations.indexOf(baselineCutoff);

  if (cutoffIndex < 0) {
    throw new Error(
      `No se encontró la migración de corte ${baselineCutoff}. Se cancela el baseline.`,
    );
  }

  const historicalMigrations = migrations.slice(0, cutoffIndex + 1);
  const pendingMigrations = migrations.slice(cutoffIndex + 1);

  if (pendingMigrations.length === 0) {
    throw new Error(
      "El baseline no dejaría migraciones pendientes. Se cancela para evitar marcar cambios nuevos como aplicados.",
    );
  }

  console.log(
    `[prisma-baseline] Base existente detectada. Se registrarán ${historicalMigrations.length} migraciones históricas hasta ${baselineCutoff}.`,
  );
  console.log(
    `[prisma-baseline] Permanecerán pendientes: ${pendingMigrations.join(", ")}`,
  );

  for (const migration of historicalMigrations) {
    console.log(`[prisma-baseline] Marcando como aplicada: ${migration}`);
    const result = runPrisma(["migrate", "resolve", "--applied", migration]);

    if (result.status !== 0) {
      throw new Error(
        `No fue posible registrar la migración histórica ${migration}.`,
      );
    }
  }
}

function recoverKnownFailedMigration(output) {
  const isKnownFailure = output.includes("P3009") &&
    output.includes(recoverableFailedMigration);

  if (!isKnownFailure) return false;

  console.log(
    `[prisma-recovery] Se detectó la migración fallida conocida ${recoverableFailedMigration}. Se marcará como revertida antes de reintentar.`,
  );

  const resolved = runPrisma([
    "migrate",
    "resolve",
    "--rolled-back",
    recoverableFailedMigration,
  ]);

  if (resolved.status !== 0) {
    throw new Error(
      `No fue posible marcar como revertida la migración ${recoverableFailedMigration}.`,
    );
  }

  return true;
}

let deploy = runPrisma(["migrate", "deploy"], { capture: true });
printCaptured(deploy);

if (deploy.status === 0) {
  process.exit(0);
}

let deployOutput = outputOf(deploy);

if (recoverKnownFailedMigration(deployOutput)) {
  console.log("[prisma-recovery] Estado reparado. Reintentando migraciones.");
  deploy = runPrisma(["migrate", "deploy"], { capture: true });
  printCaptured(deploy);

  if (deploy.status === 0) {
    process.exit(0);
  }

  deployOutput = outputOf(deploy);
}

if (!deployOutput.includes("P3005")) {
  process.exit(deploy.status ?? 1);
}

baselineExistingDatabase();

console.log("[prisma-baseline] Historial inicializado. Aplicando migraciones pendientes.");
const finalDeploy = runPrisma(["migrate", "deploy"]);
process.exit(finalDeploy.status ?? 1);
