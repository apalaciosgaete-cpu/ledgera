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

type RegisterResponse = {
  ok?: boolean;
  message?: string;
  data?: {
    user?: unknown;
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

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("personal");
  const [accordionOpen, setAccordionOpen] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    return "Error de conexión. Intenta nuevamente.";
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

      const token = response.data?.session?.token;

      if (token) {
        saveSessionToken(token);
      }

      await refreshUser();
      router.push("/portafolio");
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error));
    } finally {
      setSubmitting(false);
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
              margin: "0 0 24px",
            }}
          >
            Crear cuenta
          </h1>

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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
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

            {/* ACEPTACIÓN DE TÉRMINOS */}
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
                onChange={(e) => setAcceptedTerms(e.target.checked)}
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
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: colors.accent, textDecoration: "none", fontWeight: 600 }}
                >
                  Términos y Condiciones
                </a>{" "}
                y la{" "}
                <a
                  href="/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
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
              {submitting ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        </div>

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