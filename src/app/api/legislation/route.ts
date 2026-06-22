import { NextRequest, NextResponse } from "next/server";
import { classifyLegalContext, getLegalSourcesByDomain, legalCatalog } from "@/modules/legislation";
import type { LegalDomain } from "@/modules/legislation";

function ok(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message, data: null }, { status });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const domain = searchParams.get("domain")?.trim() as LegalDomain | null;

  if (q) return ok(classifyLegalContext(q));
  if (domain) return ok(getLegalSourcesByDomain(domain));
  return ok({ count: legalCatalog.length, items: legalCatalog });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { query?: string } | null;
  if (!body?.query?.trim()) return fail("query es obligatorio.", 400);
  return ok(classifyLegalContext(body.query));
}
