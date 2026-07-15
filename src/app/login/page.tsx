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
] as const;

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

function PasswordVisibilityIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {crossed ? (
        <path
          d="M4 4l16 16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}

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
  const [backgroundImage, setBackgroundImage] = useState<(typeof BG_IMAGES)[number]>(BG_IMAGES[0]);

  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [validatingTwoFactor, setValidatingTwoFactor] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");

  useEffect(() => {
    const selectedImage = BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)];
    setBackgroundImage(selectedImage);
  }, []);

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
    backgroundImage: `url('${backgroundImage}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    padding: "1rem 1.25rem",
    position: "relative" as const,
  };

  const overlayStyle = {
    position: "absolute" as const,
    inset: 0,
    background: "linear-gradient(180deg, rgba(4,8,20,0.18), rgba(4,8,20,0.30))",
    zIndex: 0,
  };

  const wrapperStyle = {
    position: "relative" as const,
    zIndex: 1,
    width: "100%",
    maxWidth: "440px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.45rem",
  };

  const cardStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    background: "rgba(8,13,28,0.82)",
    border: "1px solid rgba(125,203,242,0.16)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    borderRadius: "20px",
    padding: "1.65rem 2rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.9rem",
    boxShadow: "0 24px 60px rgba(0,0,0,0.38)",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 700,
    color: "var(--text-soft)",
    marginBottom: "6px",
    fontFamily: fonts.body,
  };

  const inputStyle = {
    width: "100%",
    padding: "0.78rem 0.95rem",
    borderRadius: "11px",
    border: "1px solid var(--border-strong)",
    background: "var(--bg-sunken)",
    color: "var(--text)",
    fontSize: "14px",
    fontFamily: fonts.body,
    outline: "none",
    boxSizing: "border-box" as const,
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
    borderRadius: "13px",
    padding: "0.86rem 1rem",
    background: "var(--accent)",
    color: "var(--accent-contrast)",
    fontSize: "15px",
    fontWeight: 850,
    fontFamily: fonts.body,
  };

  const secondaryButtonStyle = {
    width: "100%",
    border: "1px solid var(--border-strong)",
    borderRadius: "12px",
    padding: "0.8rem 1rem",
    background: "transparent",
    color: "var(--text)",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: fonts.body,
  };

  const passwordToggleStyle = {
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(125,203,242,0.34)",
    background: "rgba(5,10,28,0.48)",
    color: "var(--text-soft)",
    borderRadius: "10px",
    padding: 0,
    width: "52px",
    minWidth: "52px",
    cursor: "pointer",
    display: "flex",
    fontFamily: fonts.body,
  };

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />
      <div style={wrapperStyle}>
        <Logo variant="light" size="lg" />
        <section style={cardStyle}>
          <div style={{ display: "grid", gap: "0.4rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 900, color: "var(--text)", fontFamily: fonts.display }}>
              {step === "credentials" ? "Iniciar sesión" : "Verificación 2FA"}
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-soft)", lineHeight: 1.5, fontFamily: fonts.body }}>
              {step === "credentials"
                ? "Ingresa con tu correo y contraseña para continuar con LEDGERA."
                : "Introduce el código vigente de tu aplicación autenticadora."}
            </p>
          </div>

          {justRegistered && step === "credentials" ? (
            <div style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: "10px", padding: "0.8rem 0.95rem", color: "var(--gain)", fontSize: "14px", fontWeight: 600, fontFamily: fonts.body }}>
              Tu cuenta fue creada. Ahora inicia sesión.
            </div>
          ) : null}

          {step === "credentials" ? (
            <form onSubmit={handleCredentials} style={{ display: "grid", gap: "0.85rem" }}>
              <div>
                <label htmlFor="email" style={labelStyle}>Correo</label>
                <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required style={inputStyle} />
              </div>

              <div>
                <label htmlFor="password" style={labelStyle}>Contraseña</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required style={{ ...inputStyle, width: "auto", flex: 1 }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    style={passwordToggleStyle}
                  >
                    <PasswordVisibilityIcon crossed={showPassword} />
                  </button>
                </div>
              </div>

              {errorMessage ? <p role="alert" style={{ margin: 0, fontSize: "13px", color: "var(--loss)", fontWeight: 600, fontFamily: fonts.body }}>{errorMessage}</p> : null}

              <button type="submit" disabled={submitting} style={{ ...primaryButtonStyle, cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleTwoFactor} style={{ display: "grid", gap: "0.85rem" }}>
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", fontSize: "13px", fontFamily: fonts.body, flexWrap: "wrap" }}>
            <Link href="/register" style={{ color: "var(--accent)", fontWeight: 750, textDecoration: "none" }}>Crear cuenta</Link>
            <Link href="/forgot-password" style={{ color: "var(--text-soft)", textDecoration: "none" }}>¿Olvidaste tu contraseña?</Link>
          </div>

          <div style={{ display: "grid", gap: "0.2rem", paddingTop: "0.6rem", borderTop: "1px solid rgba(255,255,255,0.08)", fontFamily: fonts.body }}>
            <span style={{ color: "var(--text-soft)", fontSize: "12.5px", lineHeight: 1.35 }}>¿Sin acceso al autenticador?</span>
            <Link href="/recuperar-2fa" style={{ color: "var(--text)", fontSize: "13px", fontWeight: 750, textDecoration: "none" }}>
              Recuperar 2FA
            </Link>
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
