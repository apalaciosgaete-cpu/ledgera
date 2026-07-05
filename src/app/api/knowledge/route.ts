import { NextRequest, NextResponse } from "next/server";
import { classifyKnowledge, getKnowledgeByDomain, knowledgeCatalog } from "@/modules/knowledge";
import type { KnowledgeDomain } from "@/modules/knowledge";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
function ok(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message, data: null }, { status });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const domain = searchParams.get("domain")?.trim() as KnowledgeDomain | null;

  if (q) return ok(classifyKnowledge(q));
  if (domain) return ok(getKnowledgeByDomain(domain));
  return ok({ count: knowledgeCatalog.length, items: knowledgeCatalog });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { query?: string } | null;
  if (!body?.query?.trim()) return fail("query es obligatorio.", 400);
  return ok(classifyKnowledge(body.query));
}
