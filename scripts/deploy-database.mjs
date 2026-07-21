import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const migrationsDirectory = resolve(process.cwd(), "prisma/migrations");
const baselineCutoff = "20260713010000_remove_unused_domains";
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

const firstDeploy = runPrisma(["migrate", "deploy"], { capture: true });
printCaptured(firstDeploy);

if (firstDeploy.status === 0) {
  process.exit(0);
}

const firstOutput = `${firstDeploy.stdout ?? ""}\n${firstDeploy.stderr ?? ""}`;

if (!firstOutput.includes("P3005")) {
  process.exit(firstDeploy.status ?? 1);
}

baselineExistingDatabase();

console.log("[prisma-baseline] Historial inicializado. Aplicando migraciones pendientes.");
const finalDeploy = runPrisma(["migrate", "deploy"]);
process.exit(finalDeploy.status ?? 1);
