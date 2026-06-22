"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { colors, fonts } from "@/styles/tokens";
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

const roles: { value: Role; label: string; description: string }[] = [
  {
    value: "personal",
    label: "Persona natural",
    description: "Tengo cripto y quiero declarar mis impuestos",
  },
  {
    value: "contador",
    label: "Contador",
    description: "Gestiono clientes y sus obligaciones tributarias",
  },
  {
    value: "empresa",
    label: "Empresa",
    description: "Soy una empresa con operaciones en cripto",
  },
];

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: colors.primary,
  border: `0.5px solid ${colors.borderDark}`,
  borderRadius: "8px",
  color: "#F6F8FA",
  fontSize: "14px",
  fontFamily: fonts.body,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: colors.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "6px",
};

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

  const [step, setStep] = useState<RegisterStep>("account");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("personal");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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
      setErrorMessage("Debes aceptar los Términos y Condiciones para continuar.");
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
        body: { fullName, email, password, role },
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
        background: colors.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: fonts.body,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: #334155; }
        input:focus, select:focus { outline: none; border-color: ${colors.accent} !important; }
      `}</style>

      <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "28px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Logo variant="light" size="lg" showSubtitle />
        </div>

        <div style={{ background: colors.surfaceDark, borderRadius: "16px", padding: "32px", border: `0.5px solid ${colors.borderDark}` }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 700, color: "#F6F8FA", margin: "0 0 8px" }}>
            {step === "account" ? "Crear cuenta" : "Seguridad inicial obligatoria"}
          </h1>

          <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.5, margin: "0 0 24px" }}>
            {step === "account"
              ? acquisitionCopy ?? "LEDGERA protege información financiera y tributaria. Todas las cuentas requieren seguridad reforzada."
              : "Escanea el QR con tu app autenticadora e ingresa el código de 6 dígitos."}
          </p>

          {errorMessage && (
            <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.24)", borderRadius: 10, padding: 12, color: "#FCA5A5", fontSize: 13, marginBottom: 16 }}>
              {errorMessage}
            </div>
          )}

          {step === "account" ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label htmlFor="role" style={labelStyle}>Tipo de cuenta</label>
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
                <input id="fullName" type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} required placeholder="Tu nombre" style={fieldStyle} />
              </div>

              <div>
                <label htmlFor="email" style={labelStyle}>Correo electrónico</label>
                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="tu@correo.cl" style={fieldStyle} />
              </div>

              <div>
                <label htmlFor="password" style={labelStyle}>Contraseña</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    placeholder="Contraseña segura"
                    style={fieldStyle}
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} style={{ border: `1px solid ${colors.borderDark}`, background: colors.primary, color: colors.textMuted, borderRadius: 8, padding: "0 10px" }}>
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18, color: "#64748B", fontSize: 11 }}>
                  {PASSWORD_REQUIREMENTS.map((requirement) => (
                    <li key={requirement.id}>{requirement.label}</li>
                  ))}
                </ul>
              </div>

              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "#94A3B8", fontSize: 12, lineHeight: 1.5 }}>
                <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
                Acepto los Términos y Condiciones de LEDGERA.
              </label>

              <button type="submit" disabled={submitting} style={{ width: "100%", border: "none", borderRadius: 10, padding: "13px 16px", background: colors.accent, color: "#062016", fontSize: 14, fontWeight: 850, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.72 : 1 }}>
                {submitting ? "Creando cuenta..." : checkoutFirst ? "Activar cuenta pagada" : "Crear cuenta"}
              </button>

              <p style={{ margin: 0, color: "#94A3B8", fontSize: 12, textAlign: "center" }}>
                ¿Ya tienes cuenta? <Link href="/login" style={{ color: colors.accent }}>Inicia sesión</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifySecurity} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {qrCode && <img src={qrCode} alt="QR 2FA" style={{ width: 180, height: 180, alignSelf: "center", background: "#FFFFFF", padding: 8, borderRadius: 12 }} />}
              <p style={{ margin: 0, color: "#94A3B8", fontSize: 12, lineHeight: 1.5 }}>
                Clave manual: <span style={{ color: "#F8FAFC", fontFamily: "monospace" }}>{manualSecret}</span>
              </p>
              <div>
                <label htmlFor="twoFactorCode" style={labelStyle}>Código 2FA</label>
                <input id="twoFactorCode" inputMode="numeric" value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required placeholder="123456" style={fieldStyle} />
              </div>
              <button type="submit" disabled={verifyingSecurity} style={{ width: "100%", border: "none", borderRadius: 10, padding: "13px 16px", background: colors.accent, color: "#062016", fontSize: 14, fontWeight: 850, cursor: verifyingSecurity ? "not-allowed" : "pointer", opacity: verifyingSecurity ? 0.72 : 1 }}>
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
