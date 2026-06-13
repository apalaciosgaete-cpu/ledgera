import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { createAlert } from "@/modules/alerts/application/createAlert";
import { listUserAlerts } from "@/modules/alerts/infrastructure/alertRepository";
import {
  isValidAlertCategory,
  isValidAlertSeverity,
  isValidAlertStatus,
  type AlertCategory,
  type AlertSeverity,
  type AlertStatus,
} from "@/modules/alerts/domain/alert";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") ?? "";
    const severity = searchParams.get("severity") ?? "";
    const category = searchParams.get("category") ?? "";

    const alerts = await listUserAlerts(auth.user.id, {
      status: isValidAlertStatus(status) ? status : undefined,
      severity: isValidAlertSeverity(severity) ? severity : undefined,
      category: isValidAlertCategory(category) ? category : undefined,
    });

    return NextResponse.json({
      ok: true,
      message: "Alertas obtenidas correctamente.",
      data: alerts.map((alert) => ({
        id: alert.id,
        category: alert.category,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        status: alert.status,
        source: alert.source,
        createdAt: alert.createdAt.toISOString(),
        updatedAt: alert.updatedAt.toISOString(),
        acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
        resolvedAt: alert.resolvedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error("[alerts GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al obtener alertas.", data: null },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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
    const body = (await request.json()) as {
      userId?: string;
      category?: string;
      severity?: string;
      title?: string;
      message?: string;
      source?: string;
      metadata?: Record<string, unknown>;
    };

    const result = await createAlert({
      userId: body.userId ?? "",
      category: body.category as AlertCategory,
      severity: body.severity as AlertSeverity,
      title: body.title ?? "",
      message: body.message ?? "",
      source: body.source ?? null,
      metadata: body.metadata ?? null,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message, data: null },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Alerta creada correctamente.",
      data: result.alert,
    });
  } catch (error) {
    console.error("[alerts POST]", error);

    return NextResponse.json(
      { ok: false, message: "Error al crear alerta.", data: null },
      { status: 500 },
    );
  }
}
