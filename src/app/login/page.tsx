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
  twoFactorSetupRequired?: boolean;
  pendingUserId?: string;
  pendingEmail?: string;
  qrCode?: string;
  secret?: string;
  setupToken?: string;
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
  const { isAuthenticated, isLoading, user, refreshUser } = useAuth();

  const justRegistered = searchParams.get("registered") === "1";
  const oauth2fa = searchParams.get("oauth2fa") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pendingUserId, setPendingUserId] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [validating2FA, setValidating2FA] = useState(false);
  const [error2FA, setError2FA] = useState("");

  const [setupQrCode, setSetupQrCode] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [verifyingSetup, setVerifyingSetup] = useState(false);
  const [errorSetup, setErrorSetup] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !oauth2fa) {
      router.push("/panel");
    }
  }, [isAuthenticated, isLoading, router, oauth2fa]);

  useEffect(() => {
    if (oauth2fa && isAuthenticated && user) {
      fetch("/api/2fa/oauth-setup", { credentials: "include" })
        .then(r => r.json())
        .then(json => {
          if (json.ok && json.data) {
            setSetupQrCode(json.data.qrCode ?? "");
            setSetupSecret(json.data.secret ?? "");
            setSetupToken(json.data.setupToken ?? "");
            setSetupEmail(user.email ?? "");
            setSetupCode("");
            setErrorSetup("");
            setStep(3);
          } else {
            setErrorSetup(json.message || "No fue posible cargar la configuración de 2FA.");
          }
        })
        .catch(() => {
          setErrorSetup("Error al cargar la configuración de 2FA. Intenta recargar la página.");
        });
    }
  }, [oauth2fa, isAuthenticated, user]);

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

      if (response.twoFactorSetupRequired && response.pendingUserId) {
        setPendingUserId(response.pendingUserId);
        setSetupEmail(response.pendingEmail ?? "");
        setSetupQrCode(response.qrCode ?? "");
        setSetupSecret(response.secret ?? "");
        setSetupToken(response.setupToken ?? "");
        setSetupCode("");
        setErrorSetup("");
        setStep(3);
        return;
      }

      if (response.twoFactorRequired && response.pendingUserId) {
        setPendingUserId(response.pendingUserId);
        setIsRecovery(false);
        setStep(2);
        return;
      }

      const token = response.data?.session?.token;

      if (!token) {
        setErrorMessage("Respuesta de login inválida.");
        return;
      }

      saveSessionToken(token);
      await refreshUser();
      router.push("/panel");
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
      await refreshUser();
      router.push("/panel");
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

  async function handleSetup2FA(e: FormEvent) {
    e.preventDefault();
    setErrorSetup("");

    if (!pendingUserId) {
      setErrorSetup("Error de sesión: falta identificador de usuario. Recarga la página e intenta nuevamente.");
      return;
    }
    if (!setupCode || setupCode.length !== 6) {
      setErrorSetup("Ingresa el código de 6 dígitos de tu app autenticadora.");
      return;
    }

    const isLoginRecovery = isRecovery || !setupToken;

    if (!isLoginRecovery) {
      if (!setupEmail) {
        setErrorSetup("Error de configuración: falta el correo. Recarga la página e intenta nuevamente.");
        return;
      }
      if (!setupToken) {
        setErrorSetup("Error de configuración: falta el token de seguridad. Recarga la página e intenta nuevamente.");
        return;
      }
    }

    setVerifyingSetup(true);

    try {
      const endpoint = isLoginRecovery ? "/api/2fa/login" : "/api/2fa/registration/verify";
      const body = isLoginRecovery
        ? { userId: pendingUserId, code: setupCode }
        : { userId: pendingUserId, email: setupEmail, code: setupCode, setupToken };

      const response = await httpClient<{ ok?: boolean; message?: string; data?: { session?: { token?: string } } }>(
        endpoint,
        { method: "POST", body },
      );

      const token = response.data?.session?.token;

      if (!token) {
        setErrorSetup("No se recibió sesión tras activar 2FA.");
        return;
      }

      saveSessionToken(token);
      await refreshUser();
      router.push("/panel");
    } catch (error) {
      setErrorSetup(resolveClientError(error, "Error al verificar el código."));
    } finally {
      setVerifyingSetup(false);
    }
  }

  async function startRecovery() {
    setError2FA("");
    try {
      const response = await httpClient<{ ok?: boolean; message?: string; data?: { qrCode?: string; secret?: string } }>(
        "/api/2fa/login/setup",
        {
          method: "POST",
          body: { userId: pendingUserId, email },
        },
      );

      if (response.ok && response.data) {
        setSetupQrCode(response.data.qrCode ?? "");
        setSetupSecret(response.data.secret ?? "");
        setSetupEmail(email);
        setSetupToken("");
        setSetupCode("");
        setErrorSetup("");
        setIsRecovery(true);
        setStep(3);
      } else {
        setError2FA(response.message || "No fue posible iniciar la recuperación.");
      }
    } catch (error) {
      setError2FA(resolveClientError(error, "Error al iniciar recuperación de 2FA."));
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

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />
      <div style={wrapperStyle}>
        <Logo variant="light" size="lg" />
        <section style={cardStyle}>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, color: colors.textPrimary, fontFamily: fonts.display }}>
              {step === 1 && "Iniciar sesión"}
              {step === 2 && "Verificación 2FA"}
              {step === 3 && "Configura tu 2FA"}
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: colors.textSecondary, lineHeight: 1.6, fontFamily: fonts.body }}>
              {step === 1 && "Ingresa con tu cuenta para continuar con LEDGERA."}
              {step === 2 && "Introduce el código de tu app autenticadora para ingresar."}
              {step === 3 && "Escanea el código QR, ingresa el código de 6 dígitos y termina la configuración obligatoria."}
            </p>
          </div>

          {justRegistered && step === 1 ? (
            <div style={{ background: "rgba(15,118,110,0.08)", border: "1px solid rgba(15,118,110,0.15)", borderRadius: "10px", padding: "0.9rem 1rem", color: "#0F766E", fontSize: "14px", fontWeight: 600, fontFamily: fonts.body }}>
              Tu cuenta fue creada. Ahora inicia sesión.
            </div>
          ) : null}

          {step === 1 && (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label htmlFor="email" style={labelStyle}>Correo</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #D6E0EA", fontSize: "14px", fontFamily: fonts.body }} />
              </div>
              <div>
                <label htmlFor="password" style={labelStyle}>Contraseña</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required style={{ flex: 1, padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #D6E0EA", fontSize: "14px", fontFamily: fonts.body }} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ border: "1px solid #D6E0EA", background: "#F8FAFC", borderRadius: "10px", padding: "0 0.9rem", cursor: "pointer", fontFamily: fonts.body }}>
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {errorMessage ? <p style={{ margin: 0, fontSize: "13px", color: "#B91C1C", fontWeight: 600, fontFamily: fonts.body }}>{errorMessage}</p> : null}

              <button type="submit" disabled={submitting} style={{ width: "100%", border: "none", borderRadius: "12px", padding: "0.9rem 1rem", background: colors.primary, color: "#FFFFFF", fontSize: "15px", fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", fontFamily: fonts.body }}>
                {submitting ? "Ingresando..." : "Entrar"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handle2FA} style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label htmlFor="twofa" style={labelStyle}>Código 2FA</label>
                <input id="twofa" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={twoFACode} onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))} required style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #D6E0EA", fontSize: "18px", letterSpacing: "0.25em", textAlign: "center", fontFamily: fonts.body }} />
              </div>
              {error2FA ? <p style={{ margin: 0, fontSize: "13px", color: "#B91C1C", fontWeight: 600, fontFamily: fonts.body }}>{error2FA}</p> : null}
              <button type="submit" disabled={validating2FA} style={{ width: "100%", border: "none", borderRadius: "12px", padding: "0.9rem 1rem", background: colors.primary, color: "#FFFFFF", fontSize: "15px", fontWeight: 800, cursor: validating2FA ? "not-allowed" : "pointer", fontFamily: fonts.body }}>
                {validating2FA ? "Validando..." : "Validar código"}
              </button>
              <button type="button" onClick={startRecovery} style={{ width: "100%", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "0.9rem 1rem", background: "#FFFFFF", color: colors.textPrimary, fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>
                Reconfigurar autenticador
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSetup2FA} style={{ display: "grid", gap: "1rem" }}>
              {setupQrCode ? <img src={setupQrCode} alt="Código QR 2FA" style={{ width: 180, height: 180, objectFit: "contain", justifySelf: "center", background: "#FFFFFF", padding: 8, borderRadius: 12 }} /> : null}
              {setupSecret ? <p style={{ margin: 0, fontSize: "13px", color: colors.textSecondary, lineHeight: 1.6, fontFamily: fonts.body }}>Clave manual: <strong style={{ color: colors.textPrimary }}>{setupSecret}</strong></p> : null}
              <div>
                <label htmlFor="setupCode" style={labelStyle}>Código de 6 dígitos</label>
                <input id="setupCode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={setupCode} onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ""))} required style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #D6E0EA", fontSize: "18px", letterSpacing: "0.25em", textAlign: "center", fontFamily: fonts.body }} />
              </div>
              {errorSetup ? <p style={{ margin: 0, fontSize: "13px", color: "#B91C1C", fontWeight: 600, fontFamily: fonts.body }}>{errorSetup}</p> : null}
              <button type="submit" disabled={verifyingSetup} style={{ width: "100%", border: "none", borderRadius: "12px", padding: "0.9rem 1rem", background: colors.primary, color: "#FFFFFF", fontSize: "15px", fontWeight: 800, cursor: verifyingSetup ? "not-allowed" : "pointer", fontFamily: fonts.body }}>
                {verifyingSetup ? "Verificando..." : "Activar y entrar"}
              </button>
            </form>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", fontSize: "13px", fontFamily: fonts.body }}>
            <Link href="/register" style={{ color: colors.primary, fontWeight: 700, textDecoration: "none" }}>Crear cuenta</Link>
            <Link href="/forgot-password" style={{ color: colors.textSecondary, textDecoration: "none" }}>¿Olvidaste tu contraseña?</Link>
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
