// src/app/register/page.tsx
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
              ? acquisitionCopy ?? "LEDGERA protege información financiera y tributaria. Todas las cuentas requieren seguridad reforzada."
              : "Escanea el QR con Google Authenticator, Microsoft Authenticator, Authy u otra app compatible."}
          </p>

          <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.5, margin: 0 }}>
            Registro seguro activo. Mantén el formulario completo desde la versión anterior.
          </p>
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
