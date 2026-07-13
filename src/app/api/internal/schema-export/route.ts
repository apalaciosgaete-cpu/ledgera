export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  let schema = await readFile(schemaPath, "utf8");

  schema = schema
    .replace(/^\s*authAccounts\s+Account\[\]\s*\n/m, "")
    .replace(/^\s*authSessions\s+Session\[\]\s*\n/m, "")
    .replace(/\nmodel Account \{[\s\S]*?\n\}\n\nmodel Session \{[\s\S]*?\n\}\n\nmodel VerificationToken \{[\s\S]*?\n\}\n/g, "\n");

  const encoded = Buffer.from(schema, "utf8").toString("base64");

  return new NextResponse(encoded, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
