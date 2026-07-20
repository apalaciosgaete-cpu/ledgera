"use client";

import { FormEvent, Suspense, useMemo, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { fonts } from "@/styles/tokens";
import { saveSessionToken } from "@/modules/identity/client/authStorage";
import { useAuth } from "@/modules/identity/client/authContext";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  validatePasswordComplexity,
} from "@/modules/identity/application/password";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";

type RegisterStep = "account" | "security";

type RegisteredUser = {
  id: string;
  email: string;
};

type RegisterResponse = {
  data?: { user?: RegisteredUser };
  message?: string;
};

type Registration2FASetupResponse = {
  data?: {
    userId: string;
    email: string;
    qrCode: string;
    secret: string;
    setupToken: string;
  };
  message?: string;
};

type Registration2FAVerifyResponse = {
  data?: {
    session?: {
      token?: string;
      expiresAt?: string;
    };
  };
  message?: string;
};

const LEGAL_TERMS_VERSION = "terms-2026-07";
const LEGAL_PRIVACY_VERSION = "privacy-2026-07";

const fieldStyle: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--bg-sunken)",
  border: "0.5px solid var(--border-strong)",
  borderRadius: 9,
  color: "var(--text)",
  fontSize: 14,
  fontFamily: fonts.body,
  lineHeight: 1.35,
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 11.5,
  fontWeight: 700,
  color: "var(--text-faint)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 5,
};

const legalLinkStyle: CSSProperties = {
  color: "var(--accent)",
  fontWeight: 750,
  textDecoration: "none",
};

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: 10,
  padding: "12px 16px",
  background: "var(--accent)",
  color: "var(--accent-contrast)",
  fontSize: 14,
  fontWeight: 850,
  fontFamily: fonts.body,
};

function PasswordVisibilityIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
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
        <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const checkoutFirst = searchParams.get("checkout") === "paid-first";
  const selectedPlan = searchParams.get("plan");

  const acquisitionCopy = useMemo(() => {
    if (!checkoutFirst || !selectedPlan) return null;
    return `Pago registrado para el plan ${selectedPlan}. Completa la cuenta personal y luego activa las capacidades contratadas.`;
  }, [checkoutFirst, selectedPlan]);

  const passwordRequirementText = useMemo(
    () => PASSWORD_REQUIREMENTS.map((requirement) => requirement.label).join(" · "),
    [],
  );

  const [step, setStep] = useState<RegisterStep>("account");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verifyingSecurity, setVerifyingSecurity] = useState(false);

  function resolveErrorMessage(error: unknown) {
    if (isHttpClientError(error)) {
      if (error.status === 429 && error.retryAfterSeconds) {
        return `Demasiados intentos. Intenta nuevamente en ${error.retryAfterSeconds} segundos.`;
      }
      return error.message;
    }

    return error instanceof Error ? error.message : "Error de conexión. Intenta nuevamente.";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!acceptedTerms) {
      setErrorMessage("Debes aceptar los Términos y Condiciones para crear tu cuenta.");
      return;
    }

    if (!acceptedPrivacy) {
      setErrorMessage("Debes leer la Política de Privacidad y autorizar el tratamiento de datos personales.");
      return;
    }

    const passwordValidation = validatePasswordComplexity(password);
    if (!passwordValidation.valid) {
      setErrorMessage(passwordValidation.message ?? "La contraseña no cumple los requisitos.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await httpClient<RegisterResponse>("/api/users", {
        method: "POST",
        body: {
          fullName,
          email,
          password,
          termsAccepted: acceptedTerms,
          privacyAccepted: acceptedPrivacy,
          legalConsent: {
            termsVersion: LEGAL_TERMS_VERSION,
            privacyVersion: LEGAL_PRIVACY_VERSION,
          },
        },
      });

      const user = response.data?.user;
      if (!user?.id || !user.email) {
        throw new Error("La cuenta fue creada, pero no se recibió el usuario para configurar seguridad.");
      }

      const setupResponse = await httpClient<Registration2FASetupResponse>(
        "/api/2fa/registration/setup",
        {
          method: "POST",
          body: { userId: user.id, email: user.email },
        },
      );

      const setupData = setupResponse.data;
      if (!setupData?.qrCode || !setupData.secret || !setupData.setupToken) {
        throw new Error("No fue posible generar el QR de seguridad inicial.");
      }

      setRegisteredUser(user);
      setQrCode(setupData.qrCode);
      setManualSecret(setupData.secret);
      setSetupToken(setupData.setupToken);
      setTwoFactorCode("");
      setStep("security");
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifySecurity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!registeredUser) {
      setErrorMessage("No hay usuario registrado para activar seguridad.");
      return;
    }

    if (twoFactorCode.length !== 6) {
      setErrorMessage("Ingresa el código de 6 dígitos de tu app autenticadora.");
      return;
    }

    setVerifyingSecurity(true);

    try {
      const response = await httpClient<Registration2FAVerifyResponse>(
        "/api/2fa/registration/verify",
        {
          method: "POST",
          body: {
            userId: registeredUser.id,
            email: registeredUser.email,
            code: twoFactorCode,
            setupToken,
          },
        },
      );

      const token = response.data?.session?.token;
      if (!token) throw new Error("Seguridad activada, pero no se recibió sesión de ingreso.");

      saveSessionToken(token);
      await refreshUser();
      router.push(checkoutFirst ? "/configuracion/facturacion?checkout=success" : "/portafolio");
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error));
    } finally {
      setVerifyingSecurity(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        backgroundImage: "url('/Fondo_Loguin.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 20px",
        fontFamily: fonts.body,
        position: "relative",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: var(--text-faint); }
        input:focus { outline: none; border-color: var(--accent) !important; }
      `}</style>

      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgba(4,8,20,0.32)" }} />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <Logo variant="light" size="lg" showSubtitle />
        </div>

        <section
          style={{
            background: "var(--bg-elev)",
            borderRadius: 18,
            padding: "24px 30px",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
          }}
        >
          <h1 style={{ fontFamily: fonts.display, fontSize: 21, margin: "0 0 7px" }}>
            {step === "account" ? "Crear cuenta" : "Seguridad inicial obligatoria"}
          </h1>

          <p style={{ color: "var(--text-soft)", fontSize: 13, lineHeight: 1.5, margin: "0 0 18px" }}>
            {step === "account"
              ? acquisitionCopy ?? "Todas las cuentas públicas se crean como cuentas personales. Los planes habilitan capacidades, pero no asignan roles administrativos ni profesionales."
              : "Escanea el QR con tu aplicación autenticadora e ingresa el código de 6 dígitos."}
          </p>

          {errorMessage ? (
            <div style={{ border: "1px solid rgba(196,99,74,0.3)", borderRadius: 10, padding: "10px 12px", color: "var(--loss)", fontSize: 13, marginBottom: 14 }}>
              {errorMessage}
            </div>
          ) : null}

          {step === "account" ? (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 13 }}>
              <div>
                <label htmlFor="fullName" style={labelStyle}>Nombre completo</label>
                <input id="fullName" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required placeholder="Tu nombre" style={fieldStyle} />
              </div>

              <div>
                <label htmlFor="email" style={labelStyle}>Correo electrónico</label>
                <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="tu@correo.cl" style={fieldStyle} />
              </div>

              <div>
                <label htmlFor="password" style={labelStyle}>Contraseña</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    placeholder="Contraseña segura"
                    style={{ ...fieldStyle, flex: 1, width: "auto" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    style={{ ...fieldStyle, width: 50, display: "grid", placeItems: "center", cursor: "pointer" }}
                  >
                    <PasswordVisibilityIcon crossed={showPassword} />
                  </button>
                </div>
                <p style={{ margin: "6px 0 0", color: "var(--text-faint)", fontSize: 11, lineHeight: 1.45 }}>
                  {passwordRequirementText}
                </p>
              </div>

              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "var(--text-soft)", fontSize: 12, lineHeight: 1.45 }}>
                <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
                <span>Acepto los <Link href="/terminos" style={legalLinkStyle}>Términos y Condiciones</Link>.</span>
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "var(--text-soft)", fontSize: 12, lineHeight: 1.45 }}>
                <input type="checkbox" checked={acceptedPrivacy} onChange={(event) => setAcceptedPrivacy(event.target.checked)} />
                <span>He leído la <Link href="/privacidad" style={legalLinkStyle}>Política de Privacidad</Link> y autorizo el tratamiento de mis datos.</span>
              </label>

              <button type="submit" disabled={submitting} style={{ ...primaryButtonStyle, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Creando cuenta…" : checkoutFirst ? "Activar cuenta pagada" : "Crear cuenta"}
              </button>

              <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12, textAlign: "center" }}>
                ¿Ya tienes cuenta? <Link href="/login" style={legalLinkStyle}>Inicia sesión</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifySecurity} style={{ display: "grid", gap: 16 }}>
              {qrCode ? (
                <img src={qrCode} alt="Código QR para configurar 2FA" style={{ width: 180, height: 180, justifySelf: "center", background: "#fff", padding: 8, borderRadius: 12 }} />
              ) : null}

              <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12, lineHeight: 1.5, overflowWrap: "anywhere" }}>
                Clave manual: <span style={{ color: "var(--text)", fontFamily: fonts.mono }}>{manualSecret}</span>
              </p>

              <div>
                <label htmlFor="twoFactorCode" style={labelStyle}>Código 2FA</label>
                <input id="twoFactorCode" inputMode="numeric" value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required placeholder="123456" style={fieldStyle} />
              </div>

              <button type="submit" disabled={verifyingSecurity} style={{ ...primaryButtonStyle, cursor: verifyingSecurity ? "not-allowed" : "pointer", opacity: verifyingSecurity ? 0.7 : 1 }}>
                {verifyingSecurity ? "Verificando…" : "Activar seguridad"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
