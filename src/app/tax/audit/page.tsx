"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AuditEvent {
  id: string;
  action: string;
  createdAt: string;
  actorEmail: string;
  ipAddress: string | null;
  statusFrom?: string;
  statusTo?: string;
  metadata?: Record<string, unknown>;
}

interface IntegrityResult {
  status: "OK" | "RISK" | "CRITICAL";
  issues: Array<{
    type: string;
    message: string;
    data: Record<string, unknown>;
  }>;
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "declaration" | "classification" | "event" | "movement">("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const [timelineRes, integrityRes] = await Promise.all([
        fetch("/api/tax/audit/timeline"),
        fetch("/api/tax/audit/integrity"),
      ]);

      if (!timelineRes.ok || !integrityRes.ok) throw new Error("Failed to fetch audit data");

      const timelineData = await timelineRes.json();
      const integrityData = await integrityRes.json();

      setEvents(timelineData.data || []);
      setIntegrityResult(integrityData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching audit data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: "OK" | "RISK" | "CRITICAL") => {
    const variants = {
      OK: "bg-green-100 text-green-800",
      RISK: "bg-yellow-100 text-yellow-800",
      CRITICAL: "bg-red-100 text-red-800",
    };
    return variants[status] || variants.OK;
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      DECLARATION_CREATED: "bg-blue-100 text-blue-800",
      DECLARATION_CONFIRMED: "bg-green-100 text-green-800",
      DECLARATION_VOIDED: "bg-red-100 text-red-800",
      DECLARATION_EXPORTED: "bg-purple-100 text-purple-800",
      TAX_CLASSIFICATION_CREATED: "bg-indigo-100 text-indigo-800",
      TAX_CLASSIFICATION_APPROVED: "bg-emerald-100 text-emerald-800",
      TAX_EVENT_GENERATED: "bg-cyan-100 text-cyan-800",
      MOVEMENT_CREATED: "bg-amber-100 text-amber-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  const filteredEvents = events.filter((event) => {
    if (filter !== "all") {
      const eventType = event.action.split("_")[0].toLowerCase();
      if (eventType !== filter) return false;
    }

    if (dateRange.from && new Date(event.createdAt) < new Date(dateRange.from)) return false;
    if (dateRange.to && new Date(event.createdAt) > new Date(dateRange.to)) return false;

    return true;
  });

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando auditoría...</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Auditoría Tributaria</h1>
        <p className="text-gray-600">Historial completo de eventos y trazabilidad del sistema</p>
      </div>

      {/* Integrity Status */}
      {integrityResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Estado de Integridad</span>
              <Badge className={getStatusBadge(integrityResult.status)}>
                {integrityResult.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {integrityResult.issues.length > 0 ? (
              <div className="space-y-2">
                {integrityResult.issues.map((issue, idx) => (
                  <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="font-semibold text-red-800">{issue.type}</p>
                    <p className="text-sm text-red-700">{issue.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-700">✓ Cadena de auditoría íntegra y verificada</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(["all", "declaration", "classification", "event", "movement"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                size="sm"
              >
                {f === "all" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Desde</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hasta</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <Button onClick={fetchAuditData} variant="outline" className="w-full">
            Actualizar
          </Button>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Historial de Eventos ({filteredEvents.length})</h2>
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">{error}</div>}
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No hay eventos en el rango especificado
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getActionBadge(event.action)}>{event.action}</Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Usuario: <span className="font-medium">{event.actorEmail}</span>
                    </p>
                    {event.ipAddress && (
                      <p className="text-sm text-gray-600">
                        IP: <span className="font-mono text-xs">{event.ipAddress}</span>
                      </p>
                    )}
                    {event.statusFrom && event.statusTo && (
                      <p className="text-sm text-gray-600 mt-1">
                        {event.statusFrom} → {event.statusTo}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
