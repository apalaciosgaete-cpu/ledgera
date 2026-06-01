// src/app/register/page.tsx
"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { colors, fonts } from "@/styles/tokens";
import { saveSessionToken } from "@/modules/identity/client/authStorage";
import { useAuth } from "@/modules/identity/client/authContext";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";

type Role = "personal" | "contador" | "empresa";
type RegisterStep = "account" | "security";

type RegisteredUser = {
  id: string;
  email: string;
};

type RegisterResponse = {
  ok?: boolean;
  message?: string;
  data?: {
    user?: RegisteredUser;
    session?: {
      token?: string;
      expiresAt?: string;
    };
  };
};

type Registration2FASetupResponse = {
  ok?: boolean;
  message?: string;
  data?: {
    userId: string;
    email: string;
    qrCode: string;
    secret: string;
    setupToken: string;
  };
};

type Registration2FAVerifyResponse = {
  ok?: boolean;
  message?: string;
  data?: {
    user?: {
      id: string;
      email: string;
      twoFactorEnabled: boolean;
    };
    session?: {
      token?: string;
      expiresAt?: string;
    };
  };
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

function RegisterForm() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [step, setStep] = useState<RegisterStep>("account");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("personal");
  const [accordionOpen, setAccordionOpen] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verifyingSecurity, setVerifyingSecurity] = useState(false);

  const selectedRole =
    roles.find((currentRole) => currentRole.value === role) ?? roles[0];

  function handleSelectRole(nextRole: Role) {
    setRole(nextRole);
    setAccordionOpen(false);
  }

  function resolveErrorMessage(error: unknown) {
    if (isHttpClientError(error)) {
      if (error.status === 429 && error.retryAfterSeconds) {
        return `Demasiados intentos. Intenta nuevamente en ${error.retryAfterSeconds} segundos.`;
      }

      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Error de conexión. Intenta nuevamente.";
  }

  function normalize2FACode(value: string) {
    return value.replace(/\D/g, "").slice(0, 6);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (!acceptedTerms) {
      setErrorMessage("Debes aceptar los Términos y Condiciones para continuar.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
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
          body: {
            userId: user.id,
            email: user.email,
          },
        },
      );

      const setupData = setupResponse.data;

      if (!setupData?.qrCode || !setupData?.secret || !setupData?.setupToken) {
        throw new Error("No fue posible generar el QR de seguridad inicial.");
      }

      setRegisteredUser({
        id: user.id,
        email: user.email,
      });
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

      if (!token) {
        throw new Error("Seguridad activada, pero no se recibió sesión de ingreso.");
      }

      saveSessionToken(token);
      await refreshUser();
      router.push("/portafolio");
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
        input:focus { outline: none; border-color: ${colors.accent} !important; }
        .role-option:hover { background: rgba(22,163,74,0.06) !important; }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Logo variant="light" size="lg" showSubtitle />
        </div>

        <div
          style={{
            background: colors.surfaceDark,
            borderRadius: "16px",
            padding: "32px",
            border: `0.5px solid ${colors.borderDark}`,
          }}
        >
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: "20px",
              fontWeight: 700,
              color: "#F6F8FA",
              margin: "0 0 8px",
            }}
          >
            {step === "account" ? "Crear cuenta" : "Seguridad inicial obligatoria"}
          </h1>

          <p
            style={{
              color: "#94A3B8",
              fontSize: "13px",
              lineHeight: 1.5,
              margin: "0 0 24px",
            }}
          >
            {step === "account"
              ? "LEDGERA protege información financiera y tributaria. Todas las cuentas requieren seguridad reforzada."
              : "Escanea el QR con Google Authenticator, Microsoft Authenticator, Authy u otra app compatible."}
          </p>

          {step === "account" && (
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "6px",
                  }}
                >
                  Tipo de cuenta
                </label>

                <button
                  type="button"
                  onClick={() => setAccordionOpen(!accordionOpen)}
                  style={{
                    width: "100%",
                    background: accordionOpen
                      ? "rgba(22,163,74,0.08)"
                      : colors.primary,
                    border: accordionOpen
                      ? `1px solid ${colors.accent}`
                      : `0.5px solid ${colors.borderDark}`,
                    borderRadius: accordionOpen ? "10px 10px 0 0" : "10px",
                    padding: "12px 14px",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: colors.accent,
                        fontSize: "13px",
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      {selectedRole.label}
                    </p>
                    <p
                      style={{
                        color: "#64748B",
                        fontSize: "11px",
                        margin: 0,
                      }}
                    >
                      {selectedRole.description}
                    </p>
                  </div>

                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    style={{
                      flexShrink: 0,
                      transition: "transform 0.2s",
                      transform: accordionOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    <path
                      d="M4 6l4 4 4-4"
                      stroke="#64748B"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {accordionOpen && (
                  <div
                    style={{
                      background: "#0a1f2e",
                      border: `1px solid ${colors.accent}`,
                      borderTop: "none",
                      borderRadius: "0 0 10px 10px",
                      overflow: "hidden",
                    }}
                  >
                    {roles.map((currentRole) => (
                      <div
                        key={currentRole.value}
                        className="role-option"
                        onClick={() => handleSelectRole(currentRole.value)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "11px 14px",
                          cursor: "pointer",
                          borderBottom: `0.5px solid ${colors.borderDark}`,
                          background:
                            role === currentRole.value
                              ? "rgba(22,163,74,0.1)"
                              : "transparent",
                          transition: "all 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "50%",
                            border:
                              role === currentRole.value
                                ? "none"
                                : "2px solid #334155",
                            background:
                              role === currentRole.value
                                ? colors.accent
                                : "transparent",
                            flexShrink: 0,
                            transition: "all 0.15s",
                          }}
                        />

                        <div>
                          <p
                            style={{
                              color: "#F6F8FA",
                              fontSize: "13px",
                              fontWeight: 500,
                              margin: 0,
                            }}
                          >
                            {currentRole.label}
                          </p>
                          <p
                            style={{
                              color: "#64748B",
                              fontSize: "11px",
                              margin: 0,
                            }}
                          >
                            {currentRole.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="fullName"
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "6px",
                  }}
                >
                  Nombre completo
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  placeholder="Tu nombre"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    background: colors.primary,
                    border: `0.5px solid ${colors.borderDark}`,
                    borderRadius: "8px",
                    color: "#F6F8FA",
                    fontSize: "14px",
                    fontFamily: fonts.body,
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "6px",
                  }}
                >
                  Correo electrónico
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="tu@correo.cl"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    background: colors.primary,
                    border: `0.5px solid ${colors.borderDark}`,
                    borderRadius: "8px",
                    color: "#F6F8FA",
                    fontSize: "14px",
                    fontFamily: fonts.body,
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "6px",
                  }}
                >
                  Contraseña
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    style={{
                      width: "100%",
                      padding: "11px 42px 11px 14px",
                      background: colors.primary,
                      border: `0.5px solid ${colors.borderDark}`,
                      borderRadius: "8px",
                      color: "#F6F8FA",
                      fontSize: "14px",
                      fontFamily: fonts.body,
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: colors.textMuted,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>

                {password.length > 0 && password.length < 8 && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: colors.warning,
                      margin: "4px 0 0",
                    }}
                  >
                    {8 - password.length} caracteres más requeridos
                  </p>
                )}
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  cursor: "pointer",
                  padding: "12px",
                  borderRadius: "8px",
                  border: acceptedTerms
                    ? `1px solid rgba(22,163,74,0.35)`
                    : `0.5px solid ${colors.borderDark}`,
                  background: acceptedTerms
                    ? "rgba(22,163,74,0.05)"
                    : "transparent",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    marginTop: "1px",
                    flexShrink: 0,
                    accentColor: colors.accent,
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "12px", color: "#94A3B8", lineHeight: 1.55 }}>
                  He leído y acepto los{" "}
                  <a
                    href="/terminos"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    style={{ color: colors.accent, textDecoration: "none", fontWeight: 600 }}
                  >
                    Términos y Condiciones
                  </a>{" "}
                  y la{" "}
                  <a
                    href="/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    style={{ color: colors.accent, textDecoration: "none", fontWeight: 600 }}
                  >
                    Política de Privacidad
                  </a>
                  . Entiendo que sin esta aceptación no puedo acceder al servicio.
                </span>
              </label>

              {errorMessage && (
                <p
                  style={{
                    color: "#F87171",
                    fontSize: "13px",
                    margin: 0,
                    background: "rgba(239,68,68,0.08)",
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
                disabled={submitting || !acceptedTerms}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: !acceptedTerms
                    ? "#1e3a2f"
                    : submitting
                      ? colors.accentHover
                      : colors.accent,
                  border: "none",
                  borderRadius: "8px",
                  color: !acceptedTerms ? "#4a7a5a" : "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: fonts.body,
                  cursor: submitting || !acceptedTerms ? "not-allowed" : "pointer",
                  marginTop: "4px",
                  transition: "all 0.15s ease",
                }}
              >
                {submitting ? "Creando seguridad..." : "Crear cuenta y configurar seguridad"}
              </button>
            </form>
          )}

          {step === "security" && (
            <form
              onSubmit={handleVerifySecurity}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div
                style={{
                  background: "rgba(22,163,74,0.08)",
                  border: "1px solid rgba(22,163,74,0.28)",
                  borderRadius: "12px",
                  padding: "14px",
                }}
              >
                <p
                  style={{
                    color: "#4ADE80",
                    fontSize: "12px",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    margin: "0 0 8px",
                    textTransform: "uppercase",
                  }}
                >
                  Seguridad requerida
                </p>
                <p style={{ color: "#CBD5E1", fontSize: "13px", lineHeight: 1.5, margin: 0 }}>
                  Por seguridad, todas las cuentas LEDGERA deben activar 2FA antes de ingresar al sistema.
                </p>
              </div>

              {qrCode && (
                <div
                  style={{
                    alignItems: "center",
                    background: "#F8FAFC",
                    borderRadius: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    padding: "18px",
                  }}
                >
                  <img
                    src={qrCode}
                    alt="Código QR para activar 2FA"
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "12px",
                      height: "196px",
                      padding: "10px",
                      width: "196px",
                    }}
                  />

                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "10px 12px",
                      textAlign: "center",
                      width: "100%",
                    }}
                  >
                    <p style={{ color: "#64748B", fontSize: "12px", margin: "0 0 6px" }}>
                      Clave manual
                    </p>
                    <code
                      style={{
                        color: "#0F2A3D",
                        fontSize: "12px",
                        letterSpacing: "0.06em",
                        wordBreak: "break-all",
                      }}
                    >
                      {manualSecret}
                    </code>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="twoFactorCode"
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "6px",
                  }}
                >
                  Código de 6 dígitos
                </label>

                <input
                  id="twoFactorCode"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(event) => setTwoFactorCode(normalize2FACode(event.target.value))}
                  placeholder="000000"
                  autoFocus
                  required
                  style={{
                    width: "180px",
                    padding: "11px 14px",
                    background: colors.primary,
                    border: `0.5px solid ${colors.borderDark}`,
                    borderRadius: "8px",
                    color: "#F6F8FA",
                    fontFamily: "monospace",
                    fontSize: "24px",
                    fontWeight: 800,
                    letterSpacing: "0.28em",
                    textAlign: "center",
                  }}
                />
              </div>

              {errorMessage && (
                <p
                  style={{
                    color: "#F87171",
                    fontSize: "13px",
                    margin: 0,
                    background: "rgba(239,68,68,0.08)",
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
                disabled={verifyingSecurity || twoFactorCode.length < 6}
                style={{
                  width: "100%",
                  padding: "13px",
                  background:
                    twoFactorCode.length < 6
                      ? "#1e3a2f"
                      : verifyingSecurity
                        ? colors.accentHover
                        : colors.accent,
                  border: "none",
                  borderRadius: "8px",
                  color: twoFactorCode.length < 6 ? "#4a7a5a" : "#fff",
                  fontSize: "14px",
                  fontWeight: 700,
                  fontFamily: fonts.body,
                  cursor:
                    verifyingSecurity || twoFactorCode.length < 6
                      ? "not-allowed"
                      : "pointer",
                  marginTop: "4px",
                  transition: "all 0.15s ease",
                }}
              >
                {verifyingSecurity ? "Verificando seguridad..." : "Activar 2FA e ingresar"}
              </button>
            </form>
          )}
        </div>

        {step === "account" && (
          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: colors.textSecondary,
              margin: 0,
            }}
          >
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              style={{
                color: colors.accent,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Iniciar sesión
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}