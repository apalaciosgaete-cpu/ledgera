"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";
import { colors, fonts } from "@/styles/tokens";
import { httpClient } from "@/shared/http/httpClient";

type OnboardingStep = "WELCOME" | "CONNECT" | "PROCESSING" | "WOW_MOMENT";

type TaxSummaryResponse = {
  ok?: boolean;
  data?: {
    decision?: {
      status?: string;
      label?: string;
      headline?: string;
    };
    totals?: {
      impuestoEstimadoClp?: number;
    };
    topAssets?: Array<{ symbol: string }>;
    keyOperations?: {
      totalBuys?: number;
      totalSales?: number;
      totalStaking?: number;
    };
  };
};

const PROVIDERS = [
  { id: "binance", name: "Binance", icon: "🔶", href: "/integraciones?tab=exchange" },
  { id: "crypto", name: "Crypto.com", icon: "🔵", href: "/integraciones?tab=exchange" },
  { id: "coinbase", name: "Coinbase", icon: "🛡️", href: "/integraciones?tab=exchange" },
  { id: "kraken", name: "Kraken", icon: "🐙", href: "/integraciones?tab=exchange" },
  { id: "csv", name: "Archivo CSV", icon: "📄", href: "/import" },
];

const PROCESSING_TASKS = [
  { key: "movements", label: "Analizando movimientos..." },
  { key: "buys", label: "Compras" },
  { key: "sales", label: "Ventas" },
  { key: "staking", label: "Staking" },
  { key: "events", label: "Eventos tributarios" },
];

function formatCurrency(clp: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(clp || 0);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [step, setStep] = useState<OnboardingStep>("WELCOME");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [summary, setSummary] = useState<TaxSummaryResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Si el usuario ya completó onboarding, ir al panel.
  useEffect(() => {
    if (!isLoading && user && user.needsOnboarding === false) {
      router.replace("/panel");
    }
  }, [isLoading, user, router]);

  // En paso CONNECT o PROCESSING, consultar resumen periódicamente.
  useEffect(() => {
    if (step !== "CONNECT" && step !== "PROCESSING") return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await httpClient<TaxSummaryResponse>("/api/tax/summary", {
          method: "GET",
          auth: true,
        });

        if (cancelled) return;

        const hasMovements =
          (res.data?.keyOperations?.totalBuys ?? 0) > 0 ||
          (res.data?.keyOperations?.totalSales ?? 0) > 0 ||
          (res.data?.keyOperations?.totalStaking ?? 0) > 0;

        if (hasMovements) {
          setSummary(res.data ?? null);
          setStep("PROCESSING");
        }
      } catch {
        // Ignorar errores de polling; reintentará.
      }
    }

    void poll();
    const interval = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [step]);

  // Animación de paso PROCESSING → WOW_MOMENT.
  useEffect(() => {
    if (step !== "PROCESSING") return;

    let cancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    PROCESSING_TASKS.forEach((task, index) => {
      const timeout = setTimeout(() => {
        if (cancelled) return;
        setCompletedTasks((prev) => [...prev, task.key]);

        if (index === PROCESSING_TASKS.length - 1) {
          const finalTimeout = setTimeout(() => {
            if (!cancelled) setStep("WOW_MOMENT");
          }, 900);
          timeouts.push(finalTimeout);
        }
      }, (index + 1) * 900);
      timeouts.push(timeout);
    });

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [step]);

  function handleProviderClick(href: string) {
    router.push(href);
  }

  if (isLoading || !user) {
    return (
      <div style={screenStyle}>
        <p style={{ color: colors.textMuted }}>Cargando...</p>
      </div>
    );
  }

  if (step === "WELCOME") {
    return (
      <div style={screenStyle}>
        <div style={{ marginBottom: 32 }}>
          <Logo variant="light" size="lg" showSubtitle />
        </div>

        <div style={cardStyle}>
          <span style={eyebrowStyle}>Paso 1/4</span>
          <h1 style={headingStyle}>Bienvenido a LEDGERA</h1>
          <p style={paragraphStyle}>
            Antes de comenzar, conectemos tus datos para entregarte una visión clara de tu situación tributaria.
          </p>

          <button
            onClick={() => setStep("CONNECT")}
            style={primaryButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.accentHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent;
            }}
          >
            Conectar datos
          </button>
        </div>
      </div>
    );
  }

  if (step === "CONNECT") {
    return (
      <div style={screenStyle}>
        <div style={{ marginBottom: 32 }}>
          <Logo variant="light" size="lg" showSubtitle />
        </div>

        <div style={{ ...cardStyle, maxWidth: 640, width: "100%" }}>
          <span style={eyebrowStyle}>Paso 2/4 · Conecta Exchange</span>
          <h2 style={headingStyle}>¿De dónde vienen tus datos?</h2>
          <p style={paragraphStyle}>
            Elige tu exchange o sube un archivo CSV. En segundos analizaremos tus movimientos.
          </p>

          <div style={providersGridStyle}>
            {PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProviderClick(provider.href)}
                style={providerCardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.accent;
                  e.currentTarget.style.backgroundColor = "rgba(22, 163, 74, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.borderDark;
                  e.currentTarget.style.backgroundColor = colors.surfaceDark;
                }}
              >
                <span style={{ fontSize: 28, lineHeight: 1 }}>{provider.icon}</span>
                <span style={{ color: colors.textLight, fontWeight: 700, fontSize: 15 }}>
                  {provider.name}
                </span>
              </button>
            ))}
          </div>

          {error && <p style={errorStyle}>{error}</p>}
        </div>
      </div>
    );
  }

  if (step === "PROCESSING") {
    return (
      <div style={screenStyle}>
        <div style={{ marginBottom: 32 }}>
          <Logo variant="light" size="lg" showSubtitle />
        </div>

        <div style={{ ...cardStyle, maxWidth: 420, textAlign: "center" }}>
          <span style={eyebrowStyle}>Paso 3/4 · Importa historial</span>
          <div
            style={{
              width: 56,
              height: 56,
              border: `4px solid ${colors.accentMuted}`,
              borderTopColor: colors.accent,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 24px",
            }}
          />
          <h2 style={headingStyle}>Analizando movimientos...</h2>

          <div style={{ textAlign: "left", marginTop: 24, display: "grid", gap: 14 }}>
            {PROCESSING_TASKS.map((task) => {
              const done = completedTasks.includes(task.key);
              return (
                <div key={task.key} style={{ display: "flex", alignItems: "center", gap: 12, opacity: done ? 1 : 0.45, transition: "opacity 0.3s ease" }}>
                  <span style={{ fontSize: 18 }}>{done ? "✅" : "⏳"}</span>
                  <span style={{ color: colors.textLight, fontSize: 14, fontWeight: done ? 700 : 500 }}>
                    {task.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // WOW_MOMENT
  const decision = summary?.decision;
  const statusColors: Record<string, { bg: string; color: string }> = {
    EMPTY: { bg: "rgba(148, 163, 184, 0.15)", color: colors.textMuted },
    NO_TAX_EVENTS: { bg: "rgba(22, 163, 74, 0.15)", color: "#4ADE80" },
    PAY_REVIEW: { bg: "rgba(245, 158, 11, 0.15)", color: colors.warning },
    LOSS_REVIEW: { bg: "rgba(14, 165, 233, 0.15)", color: "#7DD3FC" },
    DECLARE_REVIEW: { bg: "rgba(245, 158, 11, 0.15)", color: colors.warning },
  };
  const statusStyle = statusColors[decision?.status ?? "EMPTY"] ?? statusColors.EMPTY;
  const detectedAssets = summary?.topAssets?.map((a) => a.symbol) ?? [];

  return (
    <div style={screenStyle}>
      <div style={{ marginBottom: 32 }}>
        <Logo variant="light" size="lg" showSubtitle />
      </div>

      <div style={{ ...cardStyle, maxWidth: 560, textAlign: "center" }}>
        <span style={eyebrowStyle}>Paso 4/4 · Mi Situación</span>
        <h2 style={headingStyle}>Tu situación frente al SII</h2>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: statusStyle.bg,
            color: statusStyle.color,
            padding: "10px 18px",
            borderRadius: 999,
            fontWeight: 800,
            fontSize: 14,
            marginBottom: 28,
          }}
        >
          <span>🟡</span>
          {decision?.label ?? "Declaración recomendada"}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
          <div style={metricCardStyle}>
            <p style={{ ...metricLabelStyle, color: colors.textMuted }}>Impuesto estimado</p>
            <p style={metricValueStyle}>
              {formatCurrency(summary?.totals?.impuestoEstimadoClp ?? 0)}
            </p>
          </div>
          <div style={metricCardStyle}>
            <p style={{ ...metricLabelStyle, color: colors.textMuted }}>Activos detectados</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
              {detectedAssets.length > 0 ? (
                detectedAssets.map((symbol) => (
                  <span key={symbol} style={assetBadgeStyle}>{symbol}</span>
                ))
              ) : (
                <span style={{ color: colors.textLight, fontWeight: 700 }}>—</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push("/panel")}
          style={primaryButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.accentHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.accent;
          }}
        >
          Ir a mi panel
        </button>
      </div>
    </div>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: colors.primary,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  fontFamily: fonts.body,
};

const cardStyle: React.CSSProperties = {
  background: colors.surfaceDark,
  border: `1px solid ${colors.borderDark}`,
  borderRadius: 16,
  padding: "36px",
  maxWidth: 480,
  width: "100%",
  textAlign: "center" as const,
};

const eyebrowStyle: React.CSSProperties = {
  color: colors.accent,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 12,
};

const headingStyle: React.CSSProperties = {
  color: colors.textLight,
  fontFamily: fonts.display,
  fontSize: 28,
  fontWeight: 800,
  margin: "0 0 12px",
  lineHeight: 1.2,
};

const paragraphStyle: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: 15,
  lineHeight: 1.55,
  margin: "0 0 28px",
};

const primaryButtonStyle: React.CSSProperties = {
  background: colors.accent,
  color: "#FFFFFF",
  border: "none",
  borderRadius: 10,
  padding: "14px 28px",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
  width: "100%",
  transition: "background-color 0.15s ease",
};

const providersGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 12,
  marginTop: 8,
};

const providerCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
  padding: "18px 12px",
  background: colors.surfaceDark,
  border: `1px solid ${colors.borderDark}`,
  borderRadius: 12,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const errorStyle: React.CSSProperties = {
  color: colors.danger,
  fontSize: 13,
  marginTop: 16,
};

const metricCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 20,
  textAlign: "center" as const,
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: 13,
  margin: "0 0 8px",
};

const metricValueStyle: React.CSSProperties = {
  color: colors.textLight,
  fontSize: 28,
  fontWeight: 800,
  margin: 0,
};

const assetBadgeStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: colors.textLight,
  padding: "6px 12px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 800,
};
