"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/modules/identity/client/authContext";
import { httpClient } from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type ProfileSummary = {
  fullName: string;
  rut: string;
  phone: string;
  address: string;
  commune: string;
};

type ApiResponse<T> = {
  ok: boolean;
  data: T;
};

type Tone = "ok" | "warn" | "neutral";

type SettingsCard = {
  title: string;
  description: string;
  href: string;
  action: string;
  status: string;
  tone: Tone;
  icon: React.ReactNode;
};

const toneStyles: Record<Tone, { background: string; color: string; border: string }> = {
  ok: {
    background: "rgba(22,163,74,0.10)",
    color: "var(--accent)",
    border: "rgba(22,163,74,0.18)",
  },
  warn: {
    background: "rgba(245,158,11,0.10)",
    color: "var(--warn)",
    border: "rgba(245,158,11,0.20)",
  },
  neutral: {
    background: "var(--bg-sunken)",
    color: "var(--text-soft)",
    border: "var(--border)",
  },
};

function IconFrame({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--accent)",
        background: "var(--accent-soft)",
        border: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

function StatusBadge({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  const style = toneStyles[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        width: "fit-content",
        maxWidth: "100%",
        padding: "4px 8px",
        borderRadius: 7,
        border: `1px solid ${style.border}`,
        background: style.background,
        color: style.color,
        fontSize: 11,
        fontWeight: 800,
        lineHeight: 1.2,
      }}
    >
      {children}
    </span>
  );
}

function SettingsCardView({ card }: { card: SettingsCard }) {
  return (
    <article
      style={{
        minHeight: 190,
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 18,
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        gap: 16,
        boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <IconFrame>{card.icon}</IconFrame>
        <StatusBadge tone={card.tone}>{card.status}</StatusBadge>
      </div>

      <div style={{ display: "grid", alignContent: "start", gap: 7 }}>
        <h2 style={{ margin: 0, color: "var(--text)", fontFamily: fonts.display, fontSize: 18, fontWeight: 800 }}>
          {card.title}
        </h2>
        <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 13, lineHeight: 1.55 }}>
          {card.description}
        </p>
      </div>

      <Link
        href={card.href}
        style={{
          minHeight: 38,
          padding: "8px 12px",
          borderRadius: 9,
          border: "1px solid var(--border)",
          background: "var(--bg-sunken)",
          color: "var(--text)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {card.action}
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let cancelled = false;

    httpClient<ApiResponse<ProfileSummary>>("/api/configuracion/perfil", { auth: true })
      .then((response) => {
        if (!cancelled) setProfile(response.data);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;
    const values = [profile.fullName, profile.rut, profile.phone, profile.address, profile.commune];
    return Math.round((values.filter((value) => value.trim().length > 0).length / values.length) * 100);
  }, [profile]);

  const cards = useMemo<SettingsCard[]>(
    () => [
      {
        title: "Perfil y datos personales",
        description: "Nombre, RUT, teléfono y domicilio usados en reportes y documentos.",
        href: "/configuracion/perfil",
        action: profileCompletion === 100 ? "Revisar perfil" : "Completar perfil",
        status: loadingProfile ? "Revisando" : profileCompletion === 100 ? "Completo" : `${profileCompletion}% completo`,
        tone: loadingProfile ? "neutral" : profileCompletion === 100 ? "ok" : "warn",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
      {
        title: "Seguridad y sesiones",
        description: "Verificación TOTP, correo confirmado y control de sesiones activas.",
        href: "/configuracion/seguridad",
        action: "Gestionar seguridad",
        status: user?.twoFactorEnabled ? "2FA activo" : "Requiere 2FA",
        tone: user?.twoFactorEnabled ? "ok" : "warn",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
      {
        title: "Identidad tributaria",
        description: "Datos legales y de contacto utilizados para documentos tributarios electrónicos.",
        href: "/configuracion/identidad-tributaria",
        action: "Revisar identidad",
        status: "Chile",
        tone: "neutral",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16" />
            <path d="M6 18V9" />
            <path d="M10 18V9" />
            <path d="M14 18V9" />
            <path d="M18 18V9" />
            <path d="M3 9h18L12 3 3 9z" />
          </svg>
        ),
      },
      {
        title: "Preferencias",
        description: "Idioma, moneda de visualización, alertas y formato de exportación.",
        href: "/configuracion/preferencias",
        action: "Configurar preferencias",
        status: "Personalizable",
        tone: "neutral",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-4v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3v-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.83-2.83.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3h4v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06 2.83 2.83-.06.06A1.65 1.65 0 0 0 19.4 9c.12.37.2.76.2 1.16V10h.4v4h-.4c0 .34-.07.67-.2 1z" />
          </svg>
        ),
      },
      {
        title: "Suscripción y pagos",
        description: "Estado del acceso, pagos registrados y documentos de cobro.",
        href: "/configuracion/facturacion",
        action: "Revisar suscripción",
        status: user?.role === "admin" ? "Cuenta interna" : user?.subscriptionPlan ?? "BÁSICO",
        tone: "neutral",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
            <line x1="6" y1="15" x2="10" y2="15" />
          </svg>
        ),
      },
      {
        title: "Auditoría",
        description: "Consulta cambios de configuración y actividad registrada sobre la cuenta.",
        href: "/configuracion/auditoria",
        action: "Ver actividad",
        status: "Trazabilidad",
        tone: "neutral",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        ),
      },
    ],
    [loadingProfile, profileCompletion, user?.role, user?.subscriptionPlan, user?.twoFactorEnabled],
  );

  return (
    <main style={{ display: "grid", gap: 20, color: "var(--text)", fontFamily: fonts.body }}>
      <header style={{ display: "grid", gap: 5 }}>
        <h1 style={{ margin: 0, color: "var(--text)", fontFamily: fonts.display, fontSize: "clamp(1.7rem,3vw,2.2rem)", fontWeight: 850, letterSpacing: "-0.035em" }}>
          Configuración
        </h1>
        <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.55 }}>
          Administra los datos y controles de tu cuenta desde cada sección.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
        {cards.map((card) => (
          <SettingsCardView key={card.href} card={card} />
        ))}
      </section>
    </main>
  );
}
