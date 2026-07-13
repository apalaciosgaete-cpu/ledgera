"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import type { AuthUser } from "@/modules/identity/client/authClient";
import { useAuth } from "@/modules/identity/client/authContext";
import { saveSessionToken } from "@/modules/identity/client/authStorage";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

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

type SessionPayload = {
  session?: {
    token?: string;
  };
  user?: Partial<AuthUser>;
};

type LoginApiResponse = {
  ok?: boolean;
  message?: string;
  twoFactorRequired?: boolean;
  pendingUserId?: string;
  pendingEmail?: string;
  data?: SessionPayload;
};

type TwoFactorLoginResponse = {
  ok?: boolean;
  message?: string;
  data?: SessionPayload;
};

function resolveClientError(error: unknown, fallback: string) {
  if (!isHttpClientError(error)) return fallback;

  if (error.status === 429 && error.retryAfterSeconds) {
    return `Demasiados intentos. Intenta nuevamente en ${error.retryAfterSeconds} segundos.`;
  }

  return error.message || fallback;
}

function isPrimeableUser(user: Partial<AuthUser> | undefined): user is AuthUser {
  return Boolean(user?.id && user.email && user.role);
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, refreshUser, primeAuthSession } = useAuth();

  const justRegistered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [validatingTwoFactor, setValidatingTwoFactor] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/panel");
    }
  }, [isAuthenticated, isLoading, router]);

  async function finishLogin(token: string, nextUser?: Partial<AuthUser>) {
    saveSessionToken(token);

    if (isPrimeableUser(nextUser)) {
      primeAuthSession({
        ...nextUser,
        twoFactorEnabled: nextUser.twoFactorEnabled ?? true,
      });
      router.replace("/panel");
      void refreshUser({ silent: true });
      return;
    }

    await refreshUser();
    router.replace("/panel");
  }

  function returnToCredentials() {
    setStep("credentials");
    setTwoFactorCode("");
    setTwoFactorError("");
    setPassword("");
  }

  async function handleCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      const response = await httpClient<LoginApiResponse>("/api/login", {
        method: "POST",
        body: { email, password },
      });

      if (response.twoFactorRequired) {
        setTwoFactorCode("");
        setTwoFactorError("");
        setStep("totp");
        return;
      }

      const token = response.data?.session?.token;
      if (!token) {
        setErrorMessage("Respuesta de inicio de sesión inválida.");
        return;
      }

      await finishLogin(token, response.data?.user);
    } catch (error) {
      setErrorMessage(resolveClientError(error, "No fue posible iniciar sesión. Intenta nuevamente."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTwoFactorError("");

    if (twoFactorCode.length !== 6) {
      setTwoFactorError("Ingresa el código de 6 dígitos de tu aplicación autenticadora.");
      return;
    }

    setValidatingTwoFactor(true);

    try {
      const response = await httpClient<TwoFactorLoginResponse>("/api/2fa/login", {
        method: "POST",
        body: { code: twoFactorCode },
      });

      const token = response.data?.session?.token;
      if (!token) {
        setTwoFactorError("Respuesta de autenticación inválida.");
        return;
      }

      await finishLogin(token, response.data?.user);
    } catch (error) {
      setTwoFactorError(resolveClientError(error, "Error al validar el código."));
    } finally {
      setValidatingTwoFactor(false);
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
    background: "rgba(15,18,19,0.72)",
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
    background: "rgba(27,33,36,0.82)",
    border: "1px solid var(--border)",
    backdropFilter: "blur(16px)",
    borderRadius: "16px",
    padding: "2rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.25rem",
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-soft)",
    marginBottom: "6px",
    fontFamily: fonts.body,
  };

  const inputStyle = {
    width: "100%",
    padding: "0.8rem 1rem",
    borderRadius: "10px",
    border: "1px solid var(--border-strong)",
    background: "var(--bg-sunken)",
    color: "var(--text)",
    fontSize: "14px",
    fontFamily: fonts.body,
  } as const;

  const codeInputStyle = {
    ...inputStyle,
    fontSize: "18px",
    letterSpacing: "0.25em",
    textAlign: "center" as const,
  };

  const primaryButtonStyle = {
    width: "100%",
    border: "none",
    borderRadius: "12px",
    padding: "0.9rem 1rem",
    background: "var(--accent)",
    color: "var(--accent-contrast)",
    fontSize: "15px",
    fontWeight: 800,
    fontFamily: fonts.body,
  };

  const secondaryButtonStyle = {
    width: "100%",
    border: "1px solid var(--border-strong)",
    borderRadius: "12px",
    padding: "0.9rem 1rem",
    background: "transparent",
    color: "var(--text)",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: fonts.body,
  };

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />
      <div style={wrapperStyle}>
        <Logo variant="light" size="lg" />
        <section style={cardStyle}>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "var(--text)", fontFamily: fonts.display }}>
              {step === "credentials" ? "Iniciar sesión" : "Verificación 2FA"}
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-soft)", lineHeight: 1.6, fontFamily: fonts.body }}>
              {step === "credentials"
                ? "Ingresa con tu correo y contraseña para continuar con LEDGERA."
                : "Introduce el código vigente de tu aplicación autenticadora."}
            </p>
          </div>

          {justRegistered && step === "credentials" ? (
            <div style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: "10px", padding: "0.9rem 1rem", color: "var(--gain)", fontSize: "14px", fontWeight: 600, fontFamily: fonts.body }}>
              Tu cuenta fue creada. Ahora inicia sesión.
            </div>
          ) : null}

          {step === "credentials" ? (
            <form onSubmit={handleCredentials} style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label htmlFor="email" style={labelStyle}>Correo</label>
                <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required style={inputStyle} />
              </div>

              <div>
                <label htmlFor="password" style={labelStyle}>Contraseña</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required style={{ ...inputStyle, width: "auto", flex: 1 }} />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} style={{ border: "1px solid var(--border-strong)", background: "var(--bg-sunken)", color: "var(--text-soft)", borderRadius: "10px", padding: "0 0.9rem", cursor: "pointer", fontFamily: fonts.body }}>
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {errorMessage ? <p role="alert" style={{ margin: 0, fontSize: "13px", color: "var(--loss)", fontWeight: 600, fontFamily: fonts.body }}>{errorMessage}</p> : null}

              <button type="submit" disabled={submitting} style={{ ...primaryButtonStyle, cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting ? "Ingresando..." : "Entrar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleTwoFactor} style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label htmlFor="twofa" style={labelStyle}>Código 2FA</label>
                <input
                  id="twofa"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(event) => {
                    setTwoFactorCode(event.target.value.replace(/\D/g, ""));
                    setTwoFactorError("");
                  }}
                  autoFocus
                  required
                  style={codeInputStyle}
                />
              </div>

              {twoFactorError ? <p role="alert" style={{ margin: 0, fontSize: "13px", color: "var(--loss)", fontWeight: 600, fontFamily: fonts.body }}>{twoFactorError}</p> : null}

              <button type="submit" disabled={validatingTwoFactor} style={{ ...primaryButtonStyle, cursor: validatingTwoFactor ? "not-allowed" : "pointer" }}>
                {validatingTwoFactor ? "Validando..." : "Validar código"}
              </button>

              <button type="button" onClick={returnToCredentials} style={secondaryButtonStyle}>
                Volver al inicio de sesión
              </button>
            </form>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", fontSize: "13px", fontFamily: fonts.body }}>
            <Link href="/register" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>Crear cuenta</Link>
            <Link href="/forgot-password" style={{ color: "var(--text-soft)", textDecoration: "none" }}>¿Olvidaste tu contraseña?</Link>
          </div>
        </section>
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
