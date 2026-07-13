export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  const schema = await readFile(schemaPath, "utf8");

  return new NextResponse(schema, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
