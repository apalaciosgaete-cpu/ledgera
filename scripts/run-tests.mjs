import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const schemaDirectory = path.join(root, "prisma", "schema");
const compatibilitySchema = path.join(root, "prisma", "schema.prisma");
const requestedTests = process.argv.slice(2);

function collectSchema() {
  return fs
    .readdirSync(schemaDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".prisma"))
    .map((entry) => entry.name)
    .sort()
    .map((fileName) => fs.readFileSync(path.join(schemaDirectory, fileName), "utf8"))
    .join("\n\n");
}

function resolveTests() {
  if (requestedTests.length > 0) return requestedTests;

  return fs
    .readdirSync(path.join(root, "tests"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".test.mjs"))
    .map((entry) => path.join("tests", entry.name))
    .sort();
}

let result;

try {
  fs.writeFileSync(compatibilitySchema, collectSchema(), "utf8");
  result = spawnSync(process.execPath, ["--test", ...resolveTests()], {
    cwd: root,
    stdio: "inherit",
  });
} finally {
  fs.rmSync(compatibilitySchema, { force: true });
}

if (result?.error) throw result.error;
process.exitCode = result?.status ?? 1;
