"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import type { AuthUser } from "@/modules/identity/client/authClient";
import { useAuth } from "@/modules/identity/client/authContext";
import { saveSessionToken } from "@/modules/identity/client/authStorage";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type SetupResponse = {
  ok: boolean;
  message: string;
  data: {
    qrCode: string;
    secret: string;
    email: string;
  };
};

type VerifyResponse = {
  ok: boolean;
  message: string;
  data: {
    user?: Partial<AuthUser>;
    session?: { token?: string };
  };
};

function errorMessage(error: unknown, fallback: string) {
  return isHttpClientError(error) ? error.message : fallback;
}

function RecoveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const { refreshUser, primeAuthSession } = useAuth();
  const setupStarted = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");

  const [loadingSetup, setLoadingSetup] = useState(Boolean(token));
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [setupError, setSetupError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    void httpClient("/api/csrf").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!token || setupStarted.current) return;
    setupStarted.current = true;

    let cancelled = false;

    async function prepareRecovery() {
      setLoadingSetup(true);
      setSetupError("");

      try {
        await httpClient("/api/csrf");
        const response = await httpClient<SetupResponse>("/api/2fa/recovery/setup", {
          method: "POST",
          body: { token },
          timeoutMs: 20_000,
        });

        if (cancelled) return;
        setQrCode(response.data.qrCode);
        setSecret(response.data.secret);
      } catch (error) {
        if (!cancelled) {
          setSetupError(errorMessage(error, "No fue posible preparar el nuevo autenticador."));
        }
      } finally {
        if (!cancelled) setLoadingSetup(false);
      }
    }

    void prepareRecovery();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function requestRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError("");
    setRequestMessage("");
    setRequesting(true);

    try {
      await httpClient("/api/csrf");
      const response = await httpClient<{ ok: boolean; message: string }>(
        "/api/2fa/recovery/request",
        {
          method: "POST",
          body: { email, password },
          timeoutMs: 20_000,
        },
      );
      setRequestSent(true);
      setRequestMessage(response.message);
    } catch (error) {
      setRequestError(errorMessage(error, "No fue posible solicitar la recuperación."));
    } finally {
      setRequesting(false);
    }
  }

  async function verifyRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSetupError("");

    if (code.length !== 6) {
      setSetupError("Ingresa el código de 6 dígitos generado por tu nuevo autenticador.");
      return;
    }

    setVerifying(true);

    try {
      const response = await httpClient<VerifyResponse>("/api/2fa/recovery/verify", {
        method: "POST",
        body: { token, code },
        timeoutMs: 20_000,
      });

      const sessionToken = response.data.session?.token;
      if (!sessionToken) {
        setSetupError("La recuperación terminó sin una sesión válida.");
        return;
      }

      saveSessionToken(sessionToken);
      const user = response.data.user;
      if (user?.id && user.email && user.role) {
        primeAuthSession({
          ...user,
          twoFactorEnabled: true,
        } as AuthUser);
        router.replace("/panel");
        void refreshUser({ silent: true });
        return;
      }

      await refreshUser();
      router.replace("/panel");
    } catch (error) {
      setSetupError(errorMessage(error, "No fue posible validar el nuevo autenticador."));
    } finally {
      setVerifying(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "0.82rem 1rem",
    borderRadius: 10,
    border: "1px solid var(--border-strong)",
    background: "var(--bg-sunken)",
    color: "var(--text)",
    fontFamily: fonts.body,
    fontSize: 14,
  } as const;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 480, background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, boxShadow: "var(--shadow-lg)", display: "grid", gap: 20 }}>
        <div style={{ display: "grid", justifyItems: "center", gap: 14 }}>
          <Logo variant="light" size="lg" />
          <div style={{ textAlign: "center", display: "grid", gap: 8 }}>
            <h1 style={{ margin: 0, color: "var(--text)", fontFamily: fonts.display, fontSize: 28 }}>Recuperar autenticador</h1>
            <p style={{ margin: 0, color: "var(--text-soft)", fontFamily: fonts.body, lineHeight: 1.55, fontSize: 14 }}>
              {token
                ? "Vincula una nueva aplicación TOTP y confirma el código generado."
                : "Confirma tus credenciales y te enviaremos un enlace seguro al correo registrado."}
            </p>
          </div>
        </div>

        {!token ? (
          requestSent ? (
            <div style={{ display: "grid", gap: 14, textAlign: "center" }}>
              <div role="status" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 12, padding: 16, color: "var(--text)", fontFamily: fonts.body, lineHeight: 1.55 }}>
                {requestMessage}
              </div>
              <Link href="/login" style={{ color: "var(--accent)", fontWeight: 800, textDecoration: "none", fontFamily: fonts.body }}>Volver al inicio de sesión</Link>
            </div>
          ) : (
            <form onSubmit={requestRecovery} style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "grid", gap: 6, color: "var(--text-soft)", fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>
                Correo
                <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} style={inputStyle} />
              </label>

              <label style={{ display: "grid", gap: 6, color: "var(--text-soft)", fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>
                Contraseña
                <div style={{ display: "flex", gap: 8 }}>
                  <input type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} style={{ ...inputStyle, flex: 1, width: "auto" }} />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} style={{ border: "1px solid var(--border-strong)", borderRadius: 10, background: "var(--bg-sunken)", color: "var(--text-soft)", padding: "0 12px", fontWeight: 700, cursor: "pointer" }}>
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </label>

              {requestError ? <p role="alert" style={{ margin: 0, color: "var(--loss)", fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>{requestError}</p> : null}

              <button type="submit" disabled={requesting} style={{ border: 0, borderRadius: 12, padding: "0.95rem 1rem", background: "var(--accent)", color: "var(--accent-contrast)", fontFamily: fonts.body, fontWeight: 900, cursor: requesting ? "not-allowed" : "pointer" }}>
                {requesting ? "Enviando enlace..." : "Enviar enlace de recuperación"}
              </button>

              <Link href="/login" style={{ textAlign: "center", color: "var(--text-soft)", textDecoration: "none", fontFamily: fonts.body, fontSize: 14 }}>Volver al inicio de sesión</Link>
            </form>
          )
        ) : loadingSetup ? (
          <p style={{ margin: 0, textAlign: "center", color: "var(--text-soft)", fontFamily: fonts.body }}>Generando un nuevo autenticador...</p>
        ) : setupError && !qrCode ? (
          <div style={{ display: "grid", gap: 14, textAlign: "center" }}>
            <p role="alert" style={{ margin: 0, color: "var(--loss)", fontFamily: fonts.body, fontWeight: 700 }}>{setupError}</p>
            <Link href="/recuperar-2fa" style={{ color: "var(--accent)", fontWeight: 800, textDecoration: "none", fontFamily: fonts.body }}>Solicitar un enlace nuevo</Link>
          </div>
        ) : (
          <form onSubmit={verifyRecovery} style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", justifyItems: "center", gap: 12 }}>
              <div style={{ background: "#fff", borderRadius: 14, padding: 12 }}>
                <Image src={qrCode} width={220} height={220} unoptimized alt="Código QR para vincular el nuevo autenticador TOTP" />
              </div>
              <p style={{ margin: 0, color: "var(--text-soft)", fontFamily: fonts.body, fontSize: 13, textAlign: "center", lineHeight: 1.5 }}>
                Escanea el QR con Google Authenticator, Microsoft Authenticator, 1Password u otra aplicación compatible con TOTP.
              </p>
              <div style={{ width: "100%", background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 12, padding: 12, display: "grid", gap: 5 }}>
                <span style={{ color: "var(--text-faint)", fontFamily: fonts.body, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Clave manual</span>
                <code style={{ color: "var(--text)", overflowWrap: "anywhere", fontSize: 13 }}>{secret}</code>
              </div>
            </div>

            <label style={{ display: "grid", gap: 6, color: "var(--text-soft)", fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>
              Código de 6 dígitos
              <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, "")); setSetupError(""); }} style={{ ...inputStyle, textAlign: "center", fontSize: 20, letterSpacing: ".25em" }} />
            </label>

            {setupError ? <p role="alert" style={{ margin: 0, color: "var(--loss)", fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>{setupError}</p> : null}

            <button type="submit" disabled={verifying} style={{ border: 0, borderRadius: 12, padding: "0.95rem 1rem", background: "var(--accent)", color: "var(--accent-contrast)", fontFamily: fonts.body, fontWeight: 900, cursor: verifying ? "not-allowed" : "pointer" }}>
              {verifying ? "Validando..." : "Activar nuevo autenticador"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default function TwoFactorRecoveryPage() {
  return (
    <Suspense>
      <RecoveryContent />
    </Suspense>
  );
}
