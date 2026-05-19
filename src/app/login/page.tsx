"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";
import { saveSessionToken } from "@/modules/identity/client/authStorage";
import { colors, fonts } from "@/styles/tokens";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";

const BG_IMAGES = [
  "/login-bg1.jpg",
  "/login-bg2.jpg",
  "/login-bg3.jpg",
  "/login-bg4.jpg",
  "/login-bg5.jpg",
  "/login-bg6.jpg",
  "/login-bg7.jpg",
  "/login-bg8.jpg",
  "/login-bg9.jpg",
  "/login-bg10.jpg",
];

const randomBg = BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)];

type LoginApiResponse = {
  ok?: boolean;
  message?: string;
  twoFactorRequired?: boolean;
  pendingUserId?: string;
  data?: {
    session?: {
      token?: string;
    };
  };
};

type TwoFactorLoginResponse = {
  ok?: boolean;
  message?: string;
  data?: {
    session?: {
      token?: string;
    };
  };
};

function resolveClientError(error: unknown, fallback: string) {
  if (!isHttpClientError(error)) {
    return fallback;
  }

  if (error.status === 429 && error.retryAfterSeconds) {
    return `Demasiados intentos. Intenta nuevamente en ${error.retryAfterSeconds} segundos.`;
  }

  if (error.status === 401) {
    return "Credenciales inválidas.";
  }

  if (error.status === 403) {
    return "La cuenta no está activa o no tiene permisos para ingresar.";
  }

  return error.message || fallback;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  const justRegistered = searchParams.get("registered") === "1";
  const planParam    = searchParams.get("plan");
  const billingParam = searchParams.get("billing") ?? "monthly";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [step, setStep] = useState<1 | 2>(1);
  const [pendingUserId, setPendingUserId] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [validating2FA, setValidating2FA] = useState(false);
  const [error2FA, setError2FA] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/portafolio");
    }
  }, [isAuthenticated, isLoading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setErrorMessage("");
    setSubmitting(true);

    try {
      const response = await httpClient<LoginApiResponse>("/api/login", {
        method: "POST",
        body: {
          email,
          password,
        },
      });

      if (response.twoFactorRequired && response.pendingUserId) {
        setPendingUserId(response.pendingUserId);
        setStep(2);
        return;
      }

      const token = response.data?.session?.token;

      if (!token) {
        setErrorMessage("Respuesta de login inválida.");
        return;
      }

      saveSessionToken(token);
      const pending = sessionStorage.getItem("pendingCheckout");
      if (pending) {
        sessionStorage.removeItem("pendingCheckout");
        const { plan, billing: b } = JSON.parse(pending) as { plan: string; billing: string };
        window.location.href = `/planes?autoCheckout=${plan}&billing=${b}`;
        return;
      }
      window.location.href = planParam
        ? `/planes?autoCheckout=${planParam}&billing=${billingParam}`
        : "/portafolio";
    } catch (error) {
      setErrorMessage(
        resolveClientError(
          error,
          "No fue posible iniciar sesión. Intenta nuevamente.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handle2FA(e: FormEvent) {
    e.preventDefault();

    setError2FA("");
    setValidating2FA(true);

    try {
      const response = await httpClient<TwoFactorLoginResponse>(
        "/api/2fa/login",
        {
          method: "POST",
          body: {
            userId: pendingUserId,
            code: twoFACode,
          },
        },
      );

      const token = response.data?.session?.token;

      if (!token) {
        setError2FA("Respuesta de autenticación inválida.");
        return;
      }

      saveSessionToken(token);
      window.location.href = "/portafolio";
    } catch (error) {
      setError2FA(
        resolveClientError(
          error,
          "Error al validar el código.",
        ),
      );
    } finally {
      setValidating2FA(false);
    }
  }

  const mainStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundImage: `url('${randomBg}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    padding: "2rem",
    position: "relative" as const,
  };

  const overlayStyle = {
    position: "absolute" as const,
    inset: 0,
    background: "rgba(6,15,23,0.68)",
    zIndex: 0,
  };

  const wrapperStyle = {
    position: "relative" as const,
    zIndex: 1,
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "1.5rem",
  };

  const cardStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(16px)",
    borderRadius: "16px",
    padding: "2rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.25rem",
    boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#0F2A3D",
    marginBottom: "6px",
    fontFamily: fonts.body,
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(15,42,61,0.2)",
    background: "rgba(255,255,255,0.9)",
    fontSize: "14px",
    fontFamily: fonts.body,
    color: "#0F2A3D",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />

      <div style={wrapperStyle}>
        <Logo variant="light" size="lg" showSubtitle />

        {step === 1 && (
          <div style={cardStyle}>
            <div>
              <h1
                style={{
                  fontFamily: fonts.display,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#0F2A3D",
                  margin: "0 0 4px",
                }}
              >
                Iniciar sesión
              </h1>

              <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
                Accede a tu cuenta Ledgera
              </p>
            </div>

            {justRegistered && (
              <div
                style={{
                  background: "rgba(22,163,74,0.08)",
                  border: "1px solid rgba(22,163,74,0.2)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#15803D",
                }}
              >
                Cuenta creada correctamente. Ingresa con tus credenciales.
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@email.com"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ ...inputStyle, paddingRight: "44px" }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748B",
                      padding: 0,
                    }}
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <p
                  style={{
                    color: "#DC2626",
                    fontSize: "13px",
                    margin: 0,
                    background: "rgba(239,68,68,0.06)",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid rgba(239,68,68,0.15)",
                  }}
                >
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: submitting ? colors.accentHover : colors.accent,
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: fonts.body,
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                {submitting ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div style={cardStyle}>
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontFamily: fonts.display,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#0F2A3D",
                  margin: "0 0 6px",
                }}
              >
                Verificación en dos pasos
              </h2>

              <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
                Ingresa el código de 6 dígitos de tu app autenticadora
              </p>
            </div>

            <form
              onSubmit={handle2FA}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                <label style={labelStyle}>Código de verificación</label>
                <input
                  type="text"
                  value={twoFACode}
                  onChange={(event) =>
                    setTwoFACode(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                  style={{
                    ...inputStyle,
                    textAlign: "center",
                    fontSize: "28px",
                    fontWeight: 700,
                    letterSpacing: "0.4em",
                    fontFamily: "monospace",
                  }}
                />
              </div>

              {error2FA && (
                <p
                  style={{
                    color: "#DC2626",
                    fontSize: "13px",
                    margin: 0,
                    background: "rgba(239,68,68,0.06)",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid rgba(239,68,68,0.15)",
                  }}
                >
                  {error2FA}
                </p>
              )}

              <button
                type="submit"
                disabled={validating2FA || twoFACode.length < 6}
                style={{
                  width: "100%",
                  padding: "13px",
                  background:
                    twoFACode.length < 6
                      ? "#94A3B8"
                      : validating2FA
                        ? colors.accentHover
                        : colors.accent,
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: fonts.body,
                  cursor:
                    validating2FA || twoFACode.length < 6
                      ? "not-allowed"
                      : "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                {validating2FA ? "Verificando..." : "Verificar"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setTwoFACode("");
                  setError2FA("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748B",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: fonts.body,
                  textDecoration: "underline",
                }}
              >
                Volver al inicio de sesión
              </button>
            </form>
          </div>
        )}

        {step === 1 && (
          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: "rgba(255,255,255,0.7)",
              margin: 0,
            }}
          >
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              style={{
                color: "#4ADE80",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Crear cuenta gratis
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}