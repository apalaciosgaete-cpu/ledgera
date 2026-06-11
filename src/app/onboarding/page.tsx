"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";
import { colors, fonts } from "@/styles/tokens";
import { httpClient } from "@/shared/http/httpClient";

type OnboardingStep = "WELCOME" | "CONNECT" | "PROCESSING" | "DONE";

type ActivationSource = "csv" | "exchange" | "bank" | "manual";

type OnboardingStatusResponse = {
  ok?: boolean;
  data?: {
    needsOnboarding?: boolean;
    hasMovements?: boolean;
    hasConnections?: boolean;
    hasBankFiles?: boolean;
    source?: ActivationSource;
  };
};

const EXCHANGE_PROVIDERS = [
  { id: "binance", name: "Binance", icon: "🔶", source: "exchange" as const },
  { id: "crypto", name: "Crypto.com", icon: "🔵", source: "exchange" as const },
  { id: "coinbase", name: "Coinbase", icon: "🛡️", source: "exchange" as const },
  { id: "kraken", name: "Kraken", icon: "🐙", source: "exchange" as const },
];

const PROCESSING_TASKS = [
  { key: "movements", label: "Analizando movimientos" },
  { key: "buys", label: "Compras" },
  { key: "sales", label: "Ventas" },
  { key: "staking", label: "Staking" },
  { key: "events", label: "Eventos tributarios" },
];

const STEP_PROGRESS: Record<OnboardingStep, number> = {
  WELCOME: 25,
  CONNECT: 50,
  PROCESSING: 75,
  DONE: 100,
};

const STORAGE_SOURCE_KEY = "ledgera_onboarding_source";
const STORAGE_ACTIVATION_LOGGED_KEY = "ledgera_activation_logged";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const [step, setStep] = useState<OnboardingStep>("WELCOME");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [hasPolled, setHasPolled] = useState(false);
  const [emptyState, setEmptyState] = useState(false);

  // Si el usuario ya completó onboarding, ir a Mi Situación.
  useEffect(() => {
    if (!isLoading && user && user.needsOnboarding === false) {
      router.replace("/mi-situacion");
    }
  }, [isLoading, user, router]);

  // En paso CONNECT, consultar estado periódicamente.
  useEffect(() => {
    if (step !== "CONNECT") return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await httpClient<OnboardingStatusResponse>("/api/onboarding/status", {
          method: "GET",
          auth: true,
        });

        if (cancelled) return;

        const status = res.data;
        const hasData =
          (status?.hasMovements ?? false) ||
          (status?.hasConnections ?? false) ||
          (status?.hasBankFiles ?? false);

        setHasPolled(true);

        if (hasData) {
          const detectedSource = status?.source ?? "manual";
          logActivationEvent(detectedSource);
          setStep("PROCESSING");
        } else if (hasPolled) {
          setEmptyState(true);
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
  }, [step, hasPolled]);

  // Animación de paso PROCESSING → DONE.
  useEffect(() => {
    if (step !== "PROCESSING" || !isAnalyzing) return;

    let cancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    PROCESSING_TASKS.forEach((task, index) => {
      const timeout = setTimeout(() => {
        if (cancelled) return;
        setCompletedTasks((prev) => [...prev, task.key]);

        if (index === PROCESSING_TASKS.length - 1) {
          const finalTimeout = setTimeout(() => {
            if (!cancelled) {
              setStep("DONE");
            }
          }, 800);
          timeouts.push(finalTimeout);
        }
      }, (index + 1) * 600);
      timeouts.push(timeout);
    });

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [step, isAnalyzing]);

  // Al llegar a DONE, refrescar sesión y redirigir a Mi Situación.
  useEffect(() => {
    if (step !== "DONE") return;

    let cancelled = false;
    const timeout = setTimeout(async () => {
      await refreshUser();
      if (!cancelled) {
        router.push("/mi-situacion");
      }
    }, 1800);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [step, refreshUser, router]);

  function setSource(source: ActivationSource) {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_SOURCE_KEY, source);
    }
  }

  function logActivationEvent(detectedSource?: ActivationSource) {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_ACTIVATION_LOGGED_KEY) === "1") return;

    const storedSource = localStorage.getItem(STORAGE_SOURCE_KEY);
    const source: ActivationSource =
      (storedSource as ActivationSource) ??
      detectedSource ??
      "manual";

    localStorage.setItem(STORAGE_ACTIVATION_LOGGED_KEY, "1");

    console.info("[activation]", {
      event: "first_data_loaded",
      userId: user?.id,
      source,
      occurredAt: new Date().toISOString(),
    });
  }

  function handleProviderClick(href: string, source: ActivationSource) {
    setSource(source);
    router.push(href);
  }

  function startAnalysis() {
    setIsAnalyzing(true);
  }

  if (isLoading || !user) {
    return (
      <div style={screenStyle}>
        <p style={{ color: colors.textMuted }}>Cargando...</p>
      </div>
    );
  }

  const progress = STEP_PROGRESS[step];

  return (
    <div style={screenStyle}>
      <div style={{ marginBottom: 28 }}>
        <Logo variant="light" size="lg" showSubtitle />
      </div>

      <div style={{ ...cardStyle, maxWidth: step === "CONNECT" ? 640 : 480, width: "100%" }}>
        <ProgressBar progress={progress} step={step} />

        {step === "WELCOME" && (
          <>
            <h1 style={headingStyle}>Bienvenido a LEDGERA</h1>
            <p style={paragraphStyle}>
              Antes de comenzar, conectemos tus datos para entregarte una visión clara de tu situación tributaria.
            </p>
            <button
              onClick={() => setStep("CONNECT")}
              style={primaryButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accentHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.accent; }}
            >
              Comenzar
            </button>
          </>
        )}

        {step === "CONNECT" && (
          <>
            <h2 style={headingStyle}>Conecta tus datos</h2>
            <p style={paragraphStyle}>
              Elige cómo quieres importar tus movimientos. El CSV es el camino más rápido.
            </p>

            {emptyState && (
              <div style={emptyStateStyle}>
                <p style={{ margin: "0 0 12px", color: colors.textLight, fontWeight: 700 }}>
                  Aún no encontramos movimientos
                </p>
                <p style={{ margin: "0 0 16px", fontSize: 13 }}>
                  Para calcular tu situación frente al SII necesitamos tus movimientos de inversión.
                </p>
                <button
                  onClick={() => handleProviderClick("/importaciones", "csv")}
                  style={{ ...primaryButtonStyle, width: "auto", padding: "10px 20px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accentHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.accent; }}
                >
                  Subir archivo
                </button>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => handleProviderClick("/import", "csv")}
                style={primaryButtonStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accentHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.accent; }}
              >
                📄 Importar CSV / Excel
              </button>
              <p style={{ ...paragraphStyle, fontSize: 12, margin: "8px 0 0" }}>
                Recomendado para comenzar
              </p>
            </div>

            <button
              onClick={() => handleProviderClick("/integraciones?tab=exchange", "exchange")}
              style={secondaryButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              Conectar exchange
            </button>

            <div style={providersGridStyle}>
              {EXCHANGE_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderClick("/integraciones?tab=exchange", provider.source)}
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
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{provider.icon}</span>
                  <span style={{ color: colors.textLight, fontWeight: 700, fontSize: 13 }}>
                    {provider.name}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${colors.borderDark}` }}>
              <p style={{ ...paragraphStyle, fontSize: 13, marginBottom: 12 }}>
                ¿No tienes exchange conectado? Puedes comenzar subiendo un archivo CSV o Excel.
              </p>
              <button
                onClick={() => handleProviderClick("/importaciones", "csv")}
                style={{ ...secondaryButtonStyle, fontSize: 13 }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                Subir archivo
              </button>
            </div>
          </>
        )}

        {step === "PROCESSING" && (
          <>
            {!isAnalyzing ? (
              <>
                <h2 style={headingStyle}>Datos recibidos</h2>
                <p style={paragraphStyle}>
                  Ya detectamos tus movimientos. Ahora los analizaremos para calcular tu situación tributaria.
                </p>
                <button
                  onClick={startAnalysis}
                  style={primaryButtonStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accentHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.accent; }}
                >
                  Analizar movimientos
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    border: `4px solid ${colors.accentMuted}`,
                    borderTopColor: colors.accent,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 20px",
                  }}
                />
                <h2 style={headingStyle}>Analizando movimientos...</h2>

                <div style={{ textAlign: "left", marginTop: 24, display: "grid", gap: 12 }}>
                  {PROCESSING_TASKS.map((task) => {
                    const done = completedTasks.includes(task.key);
                    return (
                      <div key={task.key} style={{ display: "flex", alignItems: "center", gap: 12, opacity: done ? 1 : 0.45, transition: "opacity 0.3s ease" }}>
                        <span style={{ fontSize: 16 }}>{done ? "✅" : "⏳"}</span>
                        <span style={{ color: colors.textLight, fontSize: 14, fontWeight: done ? 700 : 500 }}>
                          {task.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </>
            )}
          </>
        )}

        {step === "DONE" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={headingStyle}>¡Listo!</h2>
            <p style={paragraphStyle}>
              Ya tienes datos cargados. Te llevamos a tu situación tributaria frente al SII.
            </p>
            <button
              onClick={async () => {
                await refreshUser();
                router.push("/mi-situacion");
              }}
              style={primaryButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accentHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.accent; }}
            >
              Ver mi situación
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ progress, step }: { progress: number; step: OnboardingStep }) {
  const stepLabel =
    step === "WELCOME"
      ? "Paso 1 de 4 · Conectar datos"
      : step === "CONNECT"
        ? "Paso 2 de 4 · Importar movimientos"
        : step === "PROCESSING"
          ? "Paso 3 de 4 · Procesamiento"
          : "Paso 4 de 4 · Mi Situación";

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: colors.textMuted, fontSize: 12, fontWeight: 700 }}>{stepLabel}</span>
        <span style={{ color: colors.accent, fontSize: 12, fontWeight: 800 }}>{progress}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: colors.accent,
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
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
  padding: "32px",
  maxWidth: 480,
  width: "100%",
  textAlign: "center" as const,
};

const headingStyle: React.CSSProperties = {
  color: colors.textLight,
  fontFamily: fonts.display,
  fontSize: 26,
  fontWeight: 800,
  margin: "0 0 12px",
  lineHeight: 1.2,
};

const paragraphStyle: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: 15,
  lineHeight: 1.55,
  margin: "0 0 24px",
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

const secondaryButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: colors.textLight,
  border: `1px solid ${colors.borderDark}`,
  borderRadius: 10,
  padding: "12px 24px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
  transition: "background-color 0.15s ease",
  marginBottom: 16,
};

const providersGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
  gap: 10,
};

const providerCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  padding: "12px 8px",
  background: colors.surfaceDark,
  border: `1px solid ${colors.borderDark}`,
  borderRadius: 12,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const emptyStateStyle: React.CSSProperties = {
  background: "rgba(239, 68, 68, 0.10)",
  border: "1px solid rgba(239, 68, 68, 0.25)",
  borderRadius: 12,
  padding: 18,
  marginBottom: 20,
  textAlign: "center" as const,
};
