"use client";

import { useCallback, useEffect, useState } from "react";

import {
  httpClient,
  isHttpClientError,
} from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type ClientAccess = {
  id: string;
  clientUserId: string;
  status: string;
  permissions: string[];
  invitedAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  client: {
    id: string;
    email: string;
    fullName: string;
    rut: string | null;
    status: string;
  };
};

type ExtraSeatPrice = {
  label: string;
  currency: "CLP";
  interval: "MONTHLY";
  netAmount: number;
  taxAmount: number;
  amount: number;
};

type ClientsResponse = {
  ok: boolean;
  data: {
    includedSeats: number;
    purchasedSeats: number;
    totalSeats: number;
    activeSeatSubscriptions: number;
    nextSeatExpirationAt: string | null;
    occupiedSeats: number;
    availableSeats: number;
    extraSeatPrice: ExtraSeatPrice;
    clients: ClientAccess[];
  };
};

type SeatCheckoutResponse = {
  ok: boolean;
  data: {
    paymentId: string;
    checkoutId: string | null;
    url: string;
    price: ExtraSeatPrice;
  };
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Autorizado",
  PENDING: "Pendiente de aceptación",
  REVOKED: "Revocado",
  DECLINED: "Rechazado",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProfessionalClientsPage() {
  const [data, setData] = useState<ClientsResponse["data"] | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [buyingSeat, setBuyingSeat] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpClient<ClientsResponse>("/api/professional/clients");
      setData(response.data);
      setMessage(null);
    } catch (error) {
      setMessage({
        ok: false,
        text: isHttpClientError(error)
          ? error.message
          : "No fue posible cargar los clientes.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  async function inviteClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setMessage(null);
    try {
      await httpClient("/api/professional/clients", {
        method: "POST",
        body: { email: email.trim() },
      });
      setEmail("");
      setMessage({
        ok: true,
        text: "Invitación creada. El cliente debe aceptarla desde su cuenta.",
      });
      await loadClients();
    } catch (error) {
      setMessage({
        ok: false,
        text: isHttpClientError(error)
          ? error.message
          : "No fue posible crear la invitación.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function buyExtraSeat() {
    setBuyingSeat(true);
    setMessage(null);

    try {
      const response = await httpClient<SeatCheckoutResponse>(
        "/api/billing/professional-client-seat/checkout",
        { method: "POST" },
      );

      if (!response.data.url) {
        throw new Error("La pasarela no devolvió una URL de pago.");
      }

      window.location.assign(response.data.url);
    } catch (error) {
      setMessage({
        ok: false,
        text: isHttpClientError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : "No fue posible iniciar el pago del cupo adicional.",
      });
      setBuyingSeat(false);
    }
  }

  async function revokeClient(client: ClientAccess) {
    setActionId(client.id);
    setMessage(null);
    try {
      await httpClient(`/api/professional/clients/${client.clientUserId}`, {
        method: "DELETE",
      });
      setMessage({ ok: true, text: "Acceso revocado y cupo liberado." });
      await loadClients();
    } catch (error) {
      setMessage({
        ok: false,
        text: isHttpClientError(error)
          ? error.message
          : "No fue posible revocar el acceso.",
      });
    } finally {
      setActionId(null);
    }
  }

  const currentClients = data?.clients.filter(
    (client) => client.status === "ACTIVE" || client.status === "PENDING",
  ) ?? [];
  const historicalClients = data?.clients.filter(
    (client) => client.status !== "ACTIVE" && client.status !== "PENDING",
  ) ?? [];

  return (
    <div style={{ display: "grid", gap: 18, fontFamily: fonts.body }}>
      <section>
        <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 900, letterSpacing: "0.14em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Plan Profesional
        </p>
        <h1 style={{ color: "var(--text)", fontFamily: fonts.display, fontSize: 30, fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 8px" }}>
          Clientes y autorizaciones
        </h1>
        <p style={{ color: "var(--text-soft)", lineHeight: 1.55, margin: 0, maxWidth: 760 }}>
          Cada contribuyente conserva el control de sus datos. El acceso se activa únicamente cuando acepta tu invitación y puede revocarlo en cualquier momento.
        </p>
      </section>

      {message ? (
        <div style={{ background: message.ok ? "var(--accent-soft)" : "rgba(196,99,74,0.12)", border: `1px solid ${message.ok ? "var(--accent)" : "var(--loss)"}`, borderRadius: 14, color: message.ok ? "var(--accent)" : "var(--loss)", fontSize: 13, fontWeight: 750, padding: "12px 14px" }}>
          {message.text}
        </div>
      ) : null}

      <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
        {[
          ["Cupos incluidos", data?.includedSeats ?? "—"],
          ["Cupos adicionales", data?.purchasedSeats ?? "—"],
          ["Capacidad total", data?.totalSeats ?? "—"],
          ["Cupos ocupados", data?.occupiedSeats ?? "—"],
          ["Cupos disponibles", data?.availableSeats ?? "—"],
        ].map(([label, value]) => (
          <article key={label} style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
            <span style={{ color: "var(--text-soft)", display: "block", fontSize: 12, fontWeight: 800, marginBottom: 7 }}>{label}</span>
            <strong style={{ color: "var(--text)", fontSize: 24 }}>{loading ? "…" : value}</strong>
          </article>
        ))}
      </section>

      <section style={{ alignItems: "center", background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "space-between", padding: 18 }}>
        <div>
          <strong style={{ color: "var(--text)", display: "block", fontSize: 15 }}>
            Cliente adicional Profesional
          </strong>
          <span style={{ color: "var(--text-soft)", display: "block", fontSize: 12, marginTop: 5 }}>
            {data?.extraSeatPrice
              ? `${formatClp(data.extraSeatPrice.netAmount)} + IVA al mes · total ${formatClp(data.extraSeatPrice.amount)}`
              : "$4.990 + IVA al mes"}
          </span>
          {data?.nextSeatExpirationAt ? (
            <span style={{ color: "var(--text-faint)", display: "block", fontSize: 11, marginTop: 4 }}>
              Próximo vencimiento de cupo: {formatDate(data.nextSeatExpirationAt)}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void buyExtraSeat()}
          disabled={buyingSeat}
          style={{ background: "var(--accent)", border: 0, borderRadius: 10, color: "var(--accent-contrast)", cursor: buyingSeat ? "wait" : "pointer", fontWeight: 900, minHeight: 42, padding: "0 17px" }}
        >
          {buyingSeat ? "Abriendo pago…" : "Contratar cliente adicional"}
        </button>
      </section>

      <form onSubmit={inviteClient} style={{ alignItems: "end", background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, display: "grid", gap: 12, gridTemplateColumns: "minmax(220px,1fr) auto", padding: 18 }}>
        <label style={{ color: "var(--text)", display: "grid", fontSize: 13, fontWeight: 850, gap: 7 }}>
          Correo de la cuenta LEDGERA del cliente
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="cliente@empresa.cl"
            required
            style={{ background: "var(--bg-sunken)", border: "1px solid var(--border-strong)", borderRadius: 10, color: "var(--text)", minHeight: 44, padding: "0 12px" }}
          />
        </label>
        <button type="submit" disabled={submitting || (data?.availableSeats ?? 0) <= 0} style={{ background: "var(--accent)", border: 0, borderRadius: 10, color: "var(--accent-contrast)", cursor: submitting ? "wait" : "pointer", fontWeight: 900, minHeight: 44, padding: "0 18px", opacity: (data?.availableSeats ?? 0) <= 0 ? 0.55 : 1 }}>
          {submitting ? "Enviando…" : "Invitar cliente"}
        </button>
      </form>

      <section style={{ display: "grid", gap: 10 }}>
        <h2 style={{ color: "var(--text)", fontSize: 18, margin: 0 }}>Clientes vigentes</h2>
        {loading ? (
          <div style={{ color: "var(--text-soft)", padding: 18 }}>Cargando clientes…</div>
        ) : currentClients.length === 0 ? (
          <div style={{ background: "var(--bg-elev)", border: "1px dashed var(--border-strong)", borderRadius: 16, color: "var(--text-soft)", padding: 22 }}>
            Aún no tienes clientes vinculados.
          </div>
        ) : (
          currentClients.map((client) => (
            <article key={client.id} style={{ alignItems: "center", background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 16, display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "space-between", padding: 16 }}>
              <div style={{ minWidth: 220 }}>
                <strong style={{ color: "var(--text)", display: "block", fontSize: 15 }}>{client.client.fullName}</strong>
                <span style={{ color: "var(--text-soft)", display: "block", fontSize: 12, marginTop: 3 }}>{client.client.email}</span>
                <span style={{ color: "var(--text-faint)", display: "block", fontSize: 11, marginTop: 3 }}>RUT: {client.client.rut || "No registrado"}</span>
              </div>
              <div style={{ minWidth: 180 }}>
                <span style={{ background: client.status === "ACTIVE" ? "var(--accent-soft)" : "rgba(232,184,75,0.14)", borderRadius: 999, color: client.status === "ACTIVE" ? "var(--accent)" : "var(--warn)", display: "inline-block", fontSize: 11, fontWeight: 900, padding: "6px 9px" }}>
                  {STATUS_LABELS[client.status] ?? client.status}
                </span>
                <span style={{ color: "var(--text-faint)", display: "block", fontSize: 11, marginTop: 7 }}>Invitado: {formatDate(client.invitedAt)}</span>
              </div>
              <button type="button" onClick={() => void revokeClient(client)} disabled={actionId === client.id} style={{ background: "transparent", border: "1px solid var(--loss)", borderRadius: 9, color: "var(--loss)", cursor: "pointer", fontSize: 12, fontWeight: 850, minHeight: 38, padding: "0 13px" }}>
                {actionId === client.id ? "Revocando…" : "Revocar acceso"}
              </button>
            </article>
          ))
        )}
      </section>

      {historicalClients.length > 0 ? (
        <section style={{ display: "grid", gap: 8 }}>
          <h2 style={{ color: "var(--text)", fontSize: 16, margin: 0 }}>Historial</h2>
          {historicalClients.map((client) => (
            <div key={client.id} style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-soft)", display: "flex", justifyContent: "space-between", padding: "11px 13px" }}>
              <span>{client.client.fullName} · {client.client.email}</span>
              <span>{STATUS_LABELS[client.status] ?? client.status}</span>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
