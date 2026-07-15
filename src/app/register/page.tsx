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

type Role = "personal" | "contador" | "empresa";
type RegisterStep = "account" | "security";

type RegisteredUser = {
  id: string;
  email: string;
};

type RegisterResponse = {
  data?: {
    user?: RegisteredUser;
  };
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

const roles: { value: Role; label: string; description: string }[] = [
  {
    value: "personal",
    label: "Persona natural",
    description: "Tengo cripto y quiero declarar mis impuestos",
  },
  {
    value: "contador",
    label: "Contador / asesor tributario",
    description: "Gestiono clientes y sus obligaciones tributarias",
  },
  {
    value: "empresa",
    label: "Empresa / persona jurídica",
    description: "Soy una empresa con operaciones en cripto",
  },
];

const fieldStyle: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--bg-sunken)",
  border: "0.5px solid var(--border-strong)",
  borderRadius: "9px",
  color: "var(--text)",
  fontSize: "14px",
  fontFamily: fonts.body,
  lineHeight: 1.35,
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "11.5px",
  fontWeight: 700,
  color: "var(--text-faint)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "5px",
};

const legalLinkStyle: CSSProperties = {
  color: "var(--accent)",
  fontWeight: 750,
  textDecoration: "none",
};

const passwordToggleStyle: CSSProperties = {
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(125,203,242,0.34)",
  background: "rgba(5,10,28,0.48)",
  color: "var(--text-soft)",
  borderRadius: "10px",
  padding: 0,
  width: "50px",
  minWidth: "50px",
  cursor: "pointer",
  display: "flex",
  fontFamily: fonts.body,
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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const checkoutFirst = searchParams.get("checkout") === "paid-first";
  const selectedPlan = searchParams.get("plan");

  const acquisitionCopy = useMemo(() => {
    if (!checkoutFirst || !selectedPlan) return null;
    return `Pago registrado para plan ${selectedPlan}. Completa tu cuenta para activar acceso y seguridad.`;
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
  const [role, setRole] = useState<Role>("personal");
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

    if (error instanceof Error) return error.message;
    return "Error de conexión. Intenta nuevamente.";
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
          role,
          termsAccepted: acceptedTerms,
          privacyAccepted: acceptedPrivacy,
          legalConsent: {
            termsVersion: LEGAL_TERMS_VERSION,
            privacyVersion: LEGAL_PRIVACY_VERSION,
          },
        },
      });

      const user = response.data?.user;
      if (!user?.id || !user?.email) {
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
      if (!setupData?.qrCode || !setupData?.secret || !setupData?.setupToken) {
        throw new Error("No fue posible generar el QR de seguridad inicial.");
      }

      setRegisteredUser({ id: user.id, email: user.email });
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
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 20px",
        fontFamily: fonts.body,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: var(--text-faint); }
        input:focus, select:focus { outline: none; border-color: var(--accent) !important; }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(4,8,20,0.22), rgba(4,8,20,0.38))",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: "440px", display: "flex", flexDirection: "column", gap: "8px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Logo variant="light" size="lg" showSubtitle />
        </div>

        <div style={{ background: "var(--bg-elev)", borderRadius: "18px", padding: "24px 32px", border: "0.5px solid var(--border)", boxShadow: "0 24px 60px rgba(0,0,0,0.26)" }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: "21px", fontWeight: 850, color: "var(--text)", margin: "0 0 7px" }}>
            {step === "account" ? "Crear cuenta" : "Seguridad inicial obligatoria"}
          </h1>

          <p style={{ color: "var(--text-soft)", fontSize: "13px", lineHeight: 1.45, margin: "0 0 18px" }}>
            {step === "account"
              ? acquisitionCopy ?? "Crea tu cuenta para acceder a LEDGERA. Trataremos tus datos personales para administrar el servicio, proteger tu acceso y habilitar funciones financieras y tributarias."
              : "Escanea el QR con tu app autenticadora e ingresa el código de 6 dígitos."}
          </p>

          {errorMessage && (
            <div style={{ background: "rgba(196,99,74,0.12)", border: "1px solid rgba(196,99,74,0.24)", borderRadius: 10, padding: "10px 12px", color: "var(--loss)", fontSize: 13, marginBottom: 14 }}>
              {errorMessage}
            </div>
          )}

          {step === "account" ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div>
                <label htmlFor="role" style={labelStyle}>Tipo de contribuyente</label>
                <select id="role" value={role} onChange={(event) => setRole(event.target.value as Role)} style={fieldStyle}>
                  {roles.map((currentRole) => (
                    <option key={currentRole.value} value={currentRole.value}>
                      {currentRole.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="fullName" style={labelStyle}>Nombre completo</label>
                <input id="fullName" type="text" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required placeholder="Tu nombre" style={fieldStyle} />
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
                    style={{ ...fieldStyle, width: "auto", flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    style={passwordToggleStyle}
                  >
                    <PasswordVisibilityIcon crossed={showPassword} />
                  </button>
                </div>
                <p style={{ margin: "6px 0 0", color: "var(--text-faint)", fontSize: 11, lineHeight: 1.45 }}>
                  {passwordRequirementText}
                </p>
              </div>

              <div style={{ display: "grid", gap: 8, paddingTop: 2 }}>
                <label style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "var(--text-soft)", fontSize: 12, lineHeight: 1.45 }}>
                  <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} style={{ marginTop: 2 }} />
                  <span>
                    Acepto los <Link href="/terminos" style={legalLinkStyle}>Términos y Condiciones</Link> de LEDGERA.
                  </span>
                </label>

                <label style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "var(--text-soft)", fontSize: 12, lineHeight: 1.45 }}>
                  <input type="checkbox" checked={acceptedPrivacy} onChange={(event) => setAcceptedPrivacy(event.target.checked)} style={{ marginTop: 2 }} />
                  <span>
                    He leído la <Link href="/privacidad" style={legalLinkStyle}>Política de Privacidad</Link> y autorizo el tratamiento de mis datos personales para operar mi cuenta y prestar los servicios financieros y tributarios de LEDGERA.
                  </span>
                </label>
              </div>

              <button type="submit" disabled={submitting} style={{ width: "100%", border: "none", borderRadius: 10, padding: "12px 16px", background: "var(--accent)", color: "var(--accent-contrast)", fontSize: 14, fontWeight: 850, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.72 : 1 }}>
                {submitting ? "Creando cuenta..." : checkoutFirst ? "Activar cuenta pagada" : "Crear cuenta"}
              </button>

              <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12, textAlign: "center" }}>
                ¿Ya tienes cuenta? <Link href="/login" style={{ color: "var(--accent)", fontWeight: 750, textDecoration: "none" }}>Inicia sesión</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifySecurity} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {qrCode && <img src={qrCode} alt="QR 2FA" style={{ width: 180, height: 180, alignSelf: "center", background: "#FFFFFF", padding: 8, borderRadius: 12 }} />}
              <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12, lineHeight: 1.5 }}>
                Clave manual: <span style={{ color: "var(--text)", fontFamily: fonts.mono }}>{manualSecret}</span>
              </p>
              <div>
                <label htmlFor="twoFactorCode" style={labelStyle}>Código 2FA</label>
                <input id="twoFactorCode" inputMode="numeric" value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required placeholder="123456" style={fieldStyle} />
              </div>
              <button type="submit" disabled={verifyingSecurity} style={{ width: "100%", border: "none", borderRadius: 10, padding: "13px 16px", background: "var(--accent)", color: "var(--accent-contrast)", fontSize: 14, fontWeight: 850, cursor: verifyingSecurity ? "not-allowed" : "pointer", opacity: verifyingSecurity ? 0.72 : 1 }}>
                {verifyingSecurity ? "Verificando..." : "Activar seguridad"}
              </button>
            </form>
          )}
        </div>
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
