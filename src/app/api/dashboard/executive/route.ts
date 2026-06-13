import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { buildExecutiveDashboard } from "@/modules/dashboard/application/buildExecutiveDashboard";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Sin permisos.", data: null },
      { status: 403 },
    );
  }

  try {
    const result = await buildExecutiveDashboard();

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message, data: null },
        { status: 500 },
      );
    }

    const { snapshot } = result;

    await recordAuditEvent({
      userId: auth.user.id,
      actorId: auth.user.id,
      category: "ADMIN",
      severity: "INFO",
      event: "executive_dashboard_generated",
      description: "Dashboard ejecutivo generado",
      result: "SUCCESS",
      entityType: "Dashboard",
      entityId: "executive",
      metadata: {
        metricsCount: snapshot.dashboard.metrics.length,
        generatedAt: snapshot.dashboard.generatedAt.toISOString(),
      },
    });

    await recordAuditEvent({
      userId: auth.user.id,
      actorId: auth.user.id,
      category: "ADMIN",
      severity: "INFO",
      event: "dashboard_viewed",
      description: "Panel ejecutivo consultado",
      result: "SUCCESS",
      entityType: "Dashboard",
      entityId: "executive",
      metadata: { path: "/experto/dashboard" },
    });

    return NextResponse.json({
      ok: true,
      message: "Dashboard ejecutivo obtenido.",
      data: {
        generatedAt: snapshot.dashboard.generatedAt.toISOString(),
        metrics: snapshot.dashboard.metrics,
        alerts: snapshot.dashboard.alerts,
        risk: snapshot.dashboard.risk,
        tax: snapshot.dashboard.tax,
        billing: snapshot.dashboard.billing,
        operations: snapshot.dashboard.operations,
        audit: snapshot.dashboard.audit,
        topRisk: snapshot.topRisk.map((r) => ({
          ...r,
          evaluatedAt: r.evaluatedAt.toISOString(),
        })),
        latestAlerts: snapshot.latestAlerts.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        })),
        criticalEvents: snapshot.criticalEvents.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("[dashboard/executive GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al obtener dashboard ejecutivo.", data: null },
      { status: 500 },
    );
  }
}
