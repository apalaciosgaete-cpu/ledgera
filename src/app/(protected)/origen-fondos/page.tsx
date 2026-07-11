"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { fonts } from "@/styles/tokens";
import { httpClient } from "@/shared/http/httpClient";

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

type StagingData = {
  items: Array<{ source?: string; provider?: string; status?: string }>;
  counts: {
    pending: number;
    review: number;
    confirmed: number;
    rejected: number;
  };
};

type BankSummary = {
  totalBankMovements: number;
  pending: number;
  matched: number;
  ignored: number;
  uploads: Array<{ id: string }>;
};

type ConnectionStatus = {
  connected: boolean;
};

type OverviewState = {
  bankMovements: number;
  bankUploads: number;
  exchangeConnections: number;
  walletConnections: number;
  documents: number;
  operations: number;
  pendingOperations: number;
  confirmedOperations: number;
  loading: boolean;
};

type SourceKey = "banks" | "exchanges" | "wallets" | "documents";

type SourceOption = {
  key: SourceKey;
  href: string;
  label: string;
  description: string;
  action: string;
};

const SOURCE_OPTIONS: SourceOption[] = [
  {
    key: "banks",
    href: "/origen-fondos/bancos",
    label: "Bancos",
    description: "Importa cartolas y concilia movimientos con tus operaciones.",
    action: "Gestionar bancos",
  },
  {
    key: "exchanges",
    href: "/origen-fondos/exchanges",
    label: "Exchanges",
    description: "Sincroniza operaciones desde Binance, Buda y otras plataformas.",
    action: "Gestionar exchanges",
  },
  {
    key: "wallets",
    href: "/origen-fondos/wallets",
    label: "Wallets frías",
    description: "Asocia direcciones públicas en modo de solo lectura.",
    action: "Asociar wallet",
  },
  {
    key: "documents",
    href: "/origen-fondos/documentacion",
    label: "Documentación",
    description: "Carga historiales y documentos de respaldo tributario.",
    action: "Cargar documentos",
  },
];

const INITIAL_OVERVIEW: OverviewState = {
  bankMovements: 0,
  bankUploads: 0,
  exchangeConnections: 0,
  walletConnections: 0,
  documents: 0,
  operations: 0,
  pendingOperations: 0,
  confirmedOperations: 0,
  loading: true,
};

function SourceIcon({ type }: { type: SourceKey }) {
  const common = {
    width: 30,
    height: 30,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (type === "banks") {
    return (
      <svg {...common}>
        <path d="M3 9h18" />
        <path d="M5 9v9" />
        <path d="M9.5 9v9" />
        <path d="M14.5 9v9" />
        <path d="M19 9v9" />
        <path d="M2.5 20h19" />
        <path d="M12 3 3 7h18l-9-4Z" />
      </svg>
    );
  }

  if (type === "exchanges") {
    return (
      <svg {...common}>
        <path d="M7 7h11" />
        <path d="m15 4 3 3-3 3" />
        <path d="M17 17H6" />
        <path d="m9 20-3-3 3-3" />
        <circle cx="6" cy="7" r="2" />
        <circle cx="18" cy="17" r="2" />
      </svg>
    );
  }

  if (type === "wallets") {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="13" rx="3" />
        <path d="M16 10h5v5h-5a2.5 2.5 0 0 1 0-5Z" />
        <path d="M6 6V5a2 2 0 0 1 2-2h8" />
        <circle cx="17" cy="12.5" r=".7" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v5h5" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function pluralize(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export default function OrigenFondosPage() {
  const [overview, setOverview] = useState<OverviewState>(INITIAL_OVERVIEW);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      const [bankResult, binanceResult, budaResult, walletResult, documentResult, stagingResult] =
        await Promise.allSettled([
          httpClient<ApiResponse<BankSummary>>("/api/bank/summary", { auth: true }),
          httpClient<ApiResponse<ConnectionStatus>>("/api/integrations/binance/connection", { auth: true }),
          httpClient<ApiResponse<ConnectionStatus>>("/api/connectors/buda", { auth: true }),
          httpClient<ApiResponse<unknown[]>>("/api/wallet-connections", { auth: true }),
          httpClient<ApiResponse<unknown[]>>("/api/documents?status=ACTIVE", { auth: true }),
          httpClient<ApiResponse<StagingData>>("/api/imports/staging", { auth: true }),
        ]);

      if (cancelled) return;

      const bank = bankResult.status === "fulfilled" ? bankResult.value.data : null;
      const binance = binanceResult.status === "fulfilled" ? binanceResult.value.data : null;
      const buda = budaResult.status === "fulfilled" ? budaResult.value.data : null;
      const wallets = walletResult.status === "fulfilled" ? walletResult.value.data : [];
      const documents = documentResult.status === "fulfilled" ? documentResult.value.data : [];
      const staging = stagingResult.status === "fulfilled" ? stagingResult.value.data : null;

      setOverview({
        bankMovements: bank?.totalBankMovements ?? 0,
        bankUploads: bank?.uploads.length ?? 0,
        exchangeConnections: Number(Boolean(binance?.connected)) + Number(Boolean(buda?.connected)),
        walletConnections: wallets.length,
        documents: documents.length,
        operations: staging?.items.length ?? 0,
        pendingOperations: (staging?.counts.pending ?? 0) + (staging?.counts.review ?? 0),
        confirmedOperations: staging?.counts.confirmed ?? 0,
        loading: false,
      });
    }

    loadOverview().catch(() => {
      if (!cancelled) setOverview((current) => ({ ...current, loading: false }));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const sourceStatuses = useMemo<Record<SourceKey, string>>(() => ({
    banks: overview.loading
      ? "Actualizando estado…"
      : overview.bankMovements > 0
        ? pluralize(overview.bankMovements, "movimiento importado", "movimientos importados")
        : overview.bankUploads > 0
          ? pluralize(overview.bankUploads, "cartola cargada", "cartolas cargadas")
          : "Importación de cartolas disponible",
    exchanges: overview.loading
      ? "Actualizando estado…"
      : overview.exchangeConnections > 0
        ? pluralize(overview.exchangeConnections, "conexión activa", "conexiones activas")
        : "Binance y Buda disponibles",
    wallets: overview.loading
      ? "Actualizando estado…"
      : overview.walletConnections > 0
        ? pluralize(overview.walletConnections, "dirección asociada", "direcciones asociadas")
        : "Direcciones públicas de solo lectura",
    documents: overview.loading
      ? "Actualizando estado…"
      : overview.documents > 0
        ? pluralize(overview.documents, "documento activo", "documentos activos")
        : "CSV · Excel · PDF",
  }), [overview]);

  const sourcesWithData = useMemo(() => {
    let count = 0;
    if (overview.bankMovements > 0 || overview.bankUploads > 0) count += 1;
    if (overview.exchangeConnections > 0) count += 1;
    if (overview.walletConnections > 0) count += 1;
    if (overview.documents > 0) count += 1;
    return count;
  }, [overview]);

  const metrics: Array<{ label: string; value: ReactNode; hint: string }> = [
    {
      label: "Fuentes con información",
      value: overview.loading ? "—" : sourcesWithData,
      hint: "Bancos, exchanges, wallets o documentos con actividad.",
    },
    {
      label: "Operaciones registradas",
      value: overview.loading ? "—" : overview.operations,
      hint: "Total consolidado actualmente en Importaciones.",
    },
    {
      label: "Pendientes de revisión",
      value: overview.loading ? "—" : overview.pendingOperations,
      hint: "Registros pendientes o marcados para revisar.",
    },
    {
      label: "Operaciones confirmadas",
      value: overview.loading ? "—" : overview.confirmedOperations,
      hint: "Movimientos listos para alimentar Activos.",
    },
  ];

  return (
    <main
      style={{
        width: "100%",
        maxWidth: 1180,
        margin: "0 auto",
        minHeight: "calc(100vh - 160px)",
        display: "grid",
        gap: 24,
        alignContent: "start",
        paddingBottom: 72,
      }}
    >
      <section>
        <h1
          style={{
            color: "var(--text)",
            fontSize: "clamp(1.7rem,3vw,2.15rem)",
            fontWeight: 900,
            margin: "0 0 6px",
            letterSpacing: "-0.045em",
            fontFamily: fonts.display,
          }}
        >
          Origen de Fondos
        </h1>
        <p
          style={{
            color: "var(--text-soft)",
            fontSize: 14,
            lineHeight: 1.45,
            margin: 0,
            fontFamily: fonts.body,
          }}
        >
          Conecta o carga las fuentes que respaldan tus movimientos.
        </p>
      </section>

      <section
        aria-label="Fuentes de información"
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
        }}
      >
        {SOURCE_OPTIONS.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            style={{
              minHeight: 196,
              borderRadius: 20,
              border: "1px solid var(--border)",
              background: "var(--bg-elev)",
              color: "var(--text)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              padding: 18,
              boxShadow: "0 10px 24px rgba(15,42,61,0.045)",
              fontFamily: fonts.body,
            }}
          >
            <span
              style={{
                width: 50,
                height: 50,
                borderRadius: 15,
                display: "grid",
                placeItems: "center",
                color: "var(--accent)",
                background: "var(--bg-sunken)",
                border: "1px solid var(--border)",
                marginBottom: 18,
              }}
            >
              <SourceIcon type={option.key} />
            </span>

            <strong
              style={{
                display: "block",
                fontSize: 16,
                lineHeight: 1.2,
                fontWeight: 900,
                marginBottom: 7,
              }}
            >
              {option.label}
            </strong>

            <span
              style={{
                color: "var(--text-soft)",
                fontSize: 12.5,
                lineHeight: 1.45,
                marginBottom: 16,
              }}
            >
              {option.description}
            </span>

            <span
              style={{
                color: "var(--accent)",
                fontSize: 11.5,
                lineHeight: 1.3,
                fontWeight: 800,
                marginTop: "auto",
                marginBottom: 12,
              }}
            >
              {sourceStatuses[option.key]}
            </span>

            <span
              style={{
                paddingTop: 12,
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                color: "var(--text)",
                fontSize: 12.5,
                fontWeight: 900,
              }}
            >
              {option.action}
              <span aria-hidden="true" style={{ color: "var(--accent)", fontSize: 17 }}>→</span>
            </span>
          </Link>
        ))}
      </section>

      <section
        aria-labelledby="source-overview-title"
        style={{
          border: "1px solid var(--border)",
          borderRadius: 20,
          background: "var(--bg-elev)",
          padding: 18,
          boxShadow: "0 10px 24px rgba(15,42,61,0.035)",
          fontFamily: fonts.body,
        }}
      >
        <div style={{ marginBottom: 15 }}>
          <strong id="source-overview-title" style={{ display: "block", color: "var(--text)", fontSize: 15, fontWeight: 900 }}>
            Estado de tus fuentes
          </strong>
          <span style={{ display: "block", color: "var(--text-soft)", fontSize: 12, lineHeight: 1.4, marginTop: 3 }}>
            Resumen actualizado a partir de las conexiones e importaciones registradas.
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 10,
          }}
        >
          {metrics.map((metric) => (
            <div
              key={metric.label}
              style={{
                minHeight: 108,
                borderRadius: 16,
                border: "1px solid var(--border)",
                background: "var(--bg-sunken)",
                padding: "13px 14px",
              }}
            >
              <span style={{ display: "block", color: "var(--text-soft)", fontSize: 11.5, fontWeight: 800, marginBottom: 8 }}>
                {metric.label}
              </span>
              <strong style={{ display: "block", color: "var(--text)", fontSize: 24, lineHeight: 1, fontWeight: 950, marginBottom: 8 }}>
                {metric.value}
              </strong>
              <span style={{ display: "block", color: "var(--text-faint)", fontSize: 10.5, lineHeight: 1.35 }}>
                {metric.hint}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
