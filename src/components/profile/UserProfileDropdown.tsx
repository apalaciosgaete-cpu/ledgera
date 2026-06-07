"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { httpClient } from "@/shared/http/httpClient";

type ProfileData = {
  fullName: string;
  email:    string;
  rut:      string | null;
  phone:    string | null;
  address:  string | null;
  commune:  string | null;
  country:  string | null;
};

type Props = {
  email:    string;
  initials: string;
  avatarGradient: string;
  badgeBg:        string;
  badgeColor:     string;
  roleLabel:      string;
  onLogout: () => void;
};

function formatRut(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, "");
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const dv   = clean.slice(-1).toUpperCase();
  return `${body}-${dv}`;
}

const inputStyle: React.CSSProperties = {
  width:        "100%",
  background:   "rgba(255,255,255,0.05)",
  border:       "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  padding:      "9px 12px",
  fontSize:     "13px",
  color:        "#E2E8F0",
  outline:      "none",
  boxSizing:    "border-box",
};

const labelStyle: React.CSSProperties = {
  display:      "block",
  fontSize:     "11px",
  fontWeight:   600,
  color:        "#64748B",
  marginBottom: "5px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

function menuItemStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: active ? 700 : 600,
    color: active ? "#F8FAFC" : "#94A3B8",
    background: active ? "rgba(22,163,74,0.14)" : "transparent",
    textDecoration: "none",
    transition: "all 0.15s ease",
  };
}

export function UserProfileDropdown({
  email, initials, avatarGradient, badgeBg, badgeColor, roleLabel, onLogout,
}: Props) {
  const [open,    setOpen]    = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form,    setForm]    = useState<ProfileData>({
    fullName: "", email, rut: "", phone: "", address: "", commune: "", country: "Chile",
  });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    httpClient<{ data: ProfileData }>("/api/user/profile", { auth: true })
      .then(res => {
        setProfile(res.data);
        setForm({
          fullName: res.data.fullName ?? "",
          email:    res.data.email    ?? email,
          rut:      res.data.rut      ?? "",
          phone:    res.data.phone    ?? "",
          address:  res.data.address  ?? "",
          commune:  res.data.commune  ?? "",
          country:  res.data.country  ?? "Chile",
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los datos.");
      });
  }, [open, email]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [open]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await httpClient("/api/user/profile", {
        method: "PATCH",
        auth: true,
        body: {
          fullName: form.fullName,
          rut:      form.rut || null,
          phone:    form.phone || null,
          address:  form.address || null,
          commune:  form.commune || null,
          country:  form.country || null,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  function field(key: keyof ProfileData) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = key === "rut" ? formatRut(e.target.value) : e.target.value;
      setForm(f => ({ ...f, [key]: val }));
    };
  }

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Pill trigger */}
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(v => !v);
        }}
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            "10px",
          background:     open ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
          border:         `1px solid ${open ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)"}`,
          borderRadius:   "12px",
          padding:        "5px 6px 5px 10px",
          cursor:         "pointer",
          transition:     "all 0.15s ease",
        }}
      >
        <div style={{
          width:          "30px",
          height:         "30px",
          borderRadius:   "50%",
          background:     avatarGradient,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
        }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>
            {initials}
          </span>
        </div>
        <div className="hidden xl:flex" style={{ flexDirection: "column", gap: "4px", minWidth: 0 }}>
          <span style={{
            fontSize: "12px", fontWeight: 500, color: "#E2E8F0", lineHeight: 1,
            maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {email}
          </span>
          <span style={{
            display: "inline-flex", alignSelf: "flex-start",
            fontSize: "9px", fontWeight: 700, color: badgeColor,
            background: badgeBg, borderRadius: "4px", padding: "2px 6px",
            textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: "13px",
          }}>
            {roleLabel}
          </span>
        </div>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ marginLeft: "2px", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease", flexShrink: 0 }}
        >
          <path d="M2 4l4 4 4-4" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position:     "absolute",
          top:          "calc(100% + 8px)",
          right:        0,
          width:        "340px",
          background:   "#0F2236",
          border:       "1px solid rgba(255,255,255,0.1)",
          borderRadius: "14px",
          boxShadow:    "0 16px 40px rgba(0,0,0,0.5)",
          zIndex:       200,
          display:      "flex",
          flexDirection:"column",
          maxHeight:    "min(520px, calc(100vh - 100px))",
        }}>
          {/* Header — fijo */}
          <div style={{
            padding:      "16px 20px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink:   0,
          }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#F1F5F9" }}>
              Mi cuenta
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748B" }}>
              {email} · {roleLabel}
            </p>
          </div>

          {/* Links rápidos */}
          <div style={{
            padding: "8px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}>
            <Link href="/configuracion" onClick={() => setOpen(false)} style={menuItemStyle(false)}>
              Perfil
            </Link>
            <Link href="/planes" onClick={() => setOpen(false)} style={menuItemStyle(false)}>
              Facturación
            </Link>
            <Link href="/planes" onClick={() => setOpen(false)} style={menuItemStyle(false)}>
              Cambiar plan
            </Link>
          </div>

          {/* Body scrolleable */}
          <form
            id="profile-form"
            onSubmit={handleSave}
            style={{
              padding:    "16px 20px",
              display:    "flex",
              flexDirection: "column",
              gap:        "12px",
              overflowY:  "auto",
              flex:       1,
            }}
          >
            <div>
              <label style={labelStyle}>Nombre completo</label>
              <input
                style={inputStyle}
                value={form.fullName}
                onChange={field("fullName")}
                placeholder="Ej: Juan Pérez González"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>RUT</label>
              <input
                style={inputStyle}
                value={form.rut ?? ""}
                onChange={field("rut")}
                placeholder="12.345.678-9"
                maxLength={12}
              />
            </div>

            <div>
              <label style={labelStyle}>Dirección</label>
              <input
                style={inputStyle}
                value={form.address ?? ""}
                onChange={field("address")}
                placeholder="Av. Libertador Bernardo O'Higgins 1234"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={labelStyle}>Comuna</label>
                <input
                  style={inputStyle}
                  value={form.commune ?? ""}
                  onChange={field("commune")}
                  placeholder="Santiago"
                />
              </div>
              <div>
                <label style={labelStyle}>País</label>
                <input
                  style={inputStyle}
                  value={form.country ?? "Chile"}
                  onChange={field("country")}
                  placeholder="Chile"
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                style={{ ...inputStyle, color: "#64748B", cursor: "not-allowed" }}
                value={form.email}
                readOnly
              />
            </div>

            <div>
              <label style={labelStyle}>Teléfono</label>
              <input
                style={inputStyle}
                value={form.phone ?? ""}
                onChange={field("phone")}
                placeholder="+56 9 1234 5678"
                type="tel"
              />
            </div>

            {error && (
              <p style={{ margin: 0, fontSize: "12px", color: "#F87171", background: "rgba(239,68,68,0.08)", borderRadius: "6px", padding: "8px 10px" }}>
                {error}
              </p>
            )}
          </form>

          {/* Footer — fijo */}
          <div style={{
            padding:      "12px 20px 16px",
            borderTop:    "1px solid rgba(255,255,255,0.07)",
            flexShrink:   0,
            display:      "flex",
            flexDirection:"column",
            gap:          "8px",
          }}>
            <button
              type="submit"
              form="profile-form"
              disabled={saving || !profile}
              style={{
                width:        "100%",
                padding:      "10px",
                borderRadius: "9px",
                border:       "none",
                background:   saved ? "#15803D" : "#16A34A",
                color:        "#fff",
                fontSize:     "13px",
                fontWeight:   700,
                cursor:       saving ? "wait" : "pointer",
                opacity:      saving || !profile ? 0.7 : 1,
                transition:   "all 0.15s ease",
              }}
            >
              {saved ? "¡Guardado!" : saving ? "Guardando…" : "Guardar cambios"}
            </button>

            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              style={{
                width:        "100%",
                padding:      "10px",
                borderRadius: "9px",
                border:       "1px solid rgba(239,68,68,0.25)",
                background:   "transparent",
                color:        "#F87171",
                fontSize:     "13px",
                fontWeight:   700,
                cursor:       "pointer",
                transition:   "all 0.15s ease",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
