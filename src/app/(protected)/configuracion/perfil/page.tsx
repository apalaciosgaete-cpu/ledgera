"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/modules/identity/client/authContext";
import { formatRut, validateRut } from "@/modules/tax/application/validateRut";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  subscriptionPlan: string;
  subscriptionExpiresAt: string | null;
  twoFactorEnabled: boolean;
  rut: string;
  phone: string;
  address: string;
  commune: string;
  country: string;
};

type ProfileForm = Pick<Profile, "fullName" | "rut" | "phone" | "address" | "commune" | "country">;
type FieldName = keyof ProfileForm;
type FieldErrors = Partial<Record<FieldName, string>>;

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

const EMPTY_FORM: ProfileForm = {
  fullName: "",
  rut: "",
  phone: "",
  address: "",
  commune: "",
  country: "Chile",
};

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid var(--border)",
  background: "var(--bg-sunken)",
  color: "var(--text)",
  borderRadius: 9,
  padding: "10px 11px",
  fontSize: 14,
  fontFamily: fonts.body,
  outline: "none",
};

function normalizedPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("56") ? digits.slice(2) : digits;
}

function isValidChileanPhone(value: string) {
  return normalizedPhoneDigits(value).length === 9;
}

function formatChileanPhone(value: string) {
  const digits = normalizedPhoneDigits(value);
  if (digits.length !== 9) return value.trim();
  return `+56 ${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5)}`;
}

function fieldLabel(text: string, required = false) {
  return (
    <span style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 800 }}>
      {text}{required ? " *" : ""}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <span role="alert" style={{ color: "var(--loss)", fontSize: 11.5, lineHeight: 1.4 }}>{message}</span> : null;
}

export default function PerfilPage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    httpClient<ApiResponse<Profile>>("/api/configuracion/perfil", { auth: true })
      .then((response) => {
        if (cancelled) return;
        const nextForm: ProfileForm = {
          fullName: response.data.fullName ?? "",
          rut: response.data.rut ?? "",
          phone: response.data.phone ?? "",
          address: response.data.address ?? "",
          commune: response.data.commune ?? "",
          country: "Chile",
        };
        setProfile(response.data);
        setForm(nextForm);
        setInitialForm(nextForm);
      })
      .catch((error) => {
        if (!cancelled) {
          setNotice({ type: "error", text: isHttpClientError(error) ? error.message : "No fue posible cargar el perfil." });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = useMemo(() => {
    if (!initialForm) return false;
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  useEffect(() => {
    function preventAccidentalExit(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", preventAccidentalExit);
    return () => window.removeEventListener("beforeunload", preventAccidentalExit);
  }, [isDirty]);

  const missingFields = useMemo(() => {
    const fields: Array<[string, string]> = [
      ["Nombre o razón social", form.fullName],
      ["RUT", form.rut],
      ["Teléfono", form.phone],
      ["Dirección", form.address],
      ["Comuna", form.commune],
    ];
    return fields.filter(([, value]) => value.trim().length === 0).map(([label]) => label);
  }, [form]);

  const completion = Math.round(((5 - missingFields.length) / 5) * 100);

  function setField(field: FieldName, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  }

  function validateForm() {
    const nextErrors: FieldErrors = {};

    if (form.fullName.trim().length < 2) {
      nextErrors.fullName = "Ingresa un nombre o razón social válido.";
    }

    if (form.rut.trim()) {
      const rutResult = validateRut(form.rut);
      if (!rutResult.valid) nextErrors.rut = rutResult.message ?? "RUT inválido.";
    }

    if (form.phone.trim() && !isValidChileanPhone(form.phone)) {
      nextErrors.phone = "Ingresa un teléfono chileno de 9 dígitos, por ejemplo +56 9 1234 5678.";
    }

    if (form.address.length > 180) nextErrors.address = "La dirección no puede superar 180 caracteres.";
    if (form.commune.length > 80) nextErrors.commune = "La comuna no puede superar 80 caracteres.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function normalizeVisibleFields() {
    setForm((current) => {
      const rutResult = current.rut.trim() ? validateRut(current.rut) : null;
      return {
        ...current,
        rut: rutResult?.valid ? formatRut(current.rut) : current.rut.trim(),
        phone: current.phone.trim() ? formatChileanPhone(current.phone) : "",
        country: "Chile",
      };
    });
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!validateForm()) return;

    const rutResult = form.rut.trim() ? validateRut(form.rut) : null;
    const payload: ProfileForm = {
      fullName: form.fullName.trim(),
      rut: rutResult?.valid ? formatRut(form.rut) : "",
      phone: form.phone.trim() ? formatChileanPhone(form.phone) : "",
      address: form.address.trim(),
      commune: form.commune.trim(),
      country: "Chile",
    };

    setSaving(true);
    try {
      const response = await httpClient<ApiResponse<Profile>>("/api/configuracion/perfil", {
        method: "PUT",
        auth: true,
        body: payload,
      });

      const savedForm: ProfileForm = {
        fullName: response.data.fullName ?? "",
        rut: response.data.rut ?? "",
        phone: response.data.phone ?? "",
        address: response.data.address ?? "",
        commune: response.data.commune ?? "",
        country: "Chile",
      };

      setProfile(response.data);
      setForm(savedForm);
      setInitialForm(savedForm);
      setNotice({ type: "ok", text: "Perfil actualizado correctamente." });
      void refreshUser({ silent: true });
    } catch (error) {
      setNotice({ type: "error", text: isHttpClientError(error) ? error.message : "No fue posible guardar los cambios." });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    if (!initialForm) return;
    setForm(initialForm);
    setErrors({});
    setNotice(null);
  }

  return (
    <main style={{ display: "grid", gap: 16, color: "var(--text)", fontFamily: fonts.body }}>
      <header style={{ display: "grid", gap: 6 }}>
        <Link href="/configuracion" style={{ width: "fit-content", color: "var(--text-soft)", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
          ← Configuración
        </Link>
        <h1 style={{ margin: 0, color: "var(--text)", fontFamily: fonts.display, fontSize: 24, fontWeight: 850, letterSpacing: "-0.03em" }}>
          Perfil y datos personales
        </h1>
        <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 13, lineHeight: 1.5 }}>
          Información utilizada para identificar tus reportes, respaldos y documentos exportables.
        </p>
      </header>

      {completion < 100 && !loading ? (
        <section style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.20)", borderRadius: 12, padding: 14, display: "grid", gap: 9 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <strong style={{ color: "var(--text)", fontSize: 13 }}>Perfil {completion}% completo</strong>
            <span style={{ color: "var(--warn)", fontSize: 12, fontWeight: 800 }}>{missingFields.length} pendiente{missingFields.length === 1 ? "" : "s"}</span>
          </div>
          <div style={{ height: 5, borderRadius: 999, background: "var(--bg-sunken)", overflow: "hidden" }}>
            <div style={{ width: `${completion}%`, height: "100%", background: "var(--warn)", borderRadius: 999 }} />
          </div>
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12, lineHeight: 1.45 }}>
            Falta completar: {missingFields.join(", ")}.
          </p>
        </section>
      ) : null}

      {notice ? (
        <div role={notice.type === "error" ? "alert" : "status"} style={{ borderRadius: 10, padding: "10px 12px", fontSize: 12.5, fontWeight: 700, color: notice.type === "ok" ? "var(--accent)" : "var(--loss)", background: notice.type === "ok" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.07)", border: `1px solid ${notice.type === "ok" ? "rgba(22,163,74,0.18)" : "rgba(220,38,38,0.20)"}` }}>
          {notice.text}
        </div>
      ) : null}

      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
        {loading ? (
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 13 }}>Cargando perfil...</p>
        ) : (
          <form onSubmit={saveProfile} style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
              <label style={{ display: "grid", gap: 6 }}>
                {fieldLabel("Nombre / razón social", true)}
                <input maxLength={120} value={form.fullName} onChange={(event) => setField("fullName", event.target.value)} style={{ ...fieldStyle, borderColor: errors.fullName ? "var(--loss)" : "var(--border)" }} />
                <FieldError message={errors.fullName} />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                {fieldLabel("RUT")}
                <input maxLength={20} value={form.rut} onChange={(event) => setField("rut", event.target.value.toUpperCase())} onBlur={normalizeVisibleFields} placeholder="12.345.678-9" style={{ ...fieldStyle, borderColor: errors.rut ? "var(--loss)" : "var(--border)" }} />
                <FieldError message={errors.rut} />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                {fieldLabel("Teléfono")}
                <input type="tel" maxLength={30} value={form.phone} onChange={(event) => setField("phone", event.target.value)} onBlur={normalizeVisibleFields} placeholder="+56 9 1234 5678" style={{ ...fieldStyle, borderColor: errors.phone ? "var(--loss)" : "var(--border)" }} />
                <FieldError message={errors.phone} />
              </label>

              <div style={{ display: "grid", gap: 6 }}>
                {fieldLabel("País tributario")}
                <div style={{ ...fieldStyle, color: "var(--text-soft)", cursor: "not-allowed", display: "flex", alignItems: "center", minHeight: 40 }}>
                  Chile
                </div>
                <span style={{ color: "var(--text-faint)", fontSize: 11.5 }}>LEDGERA aplica actualmente normativa tributaria chilena.</span>
              </div>

              <label style={{ display: "grid", gap: 6 }}>
                {fieldLabel("Comuna")}
                <input maxLength={80} value={form.commune} onChange={(event) => setField("commune", event.target.value)} style={{ ...fieldStyle, borderColor: errors.commune ? "var(--loss)" : "var(--border)" }} />
                <FieldError message={errors.commune} />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                {fieldLabel("Dirección")}
                <input maxLength={180} value={form.address} onChange={(event) => setField("address", event.target.value)} style={{ ...fieldStyle, borderColor: errors.address ? "var(--loss)" : "var(--border)" }} />
                <FieldError message={errors.address} />
              </label>
            </div>

            <div style={{ paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span style={{ color: "var(--text-faint)", fontSize: 12 }}>Correo de acceso: {profile?.email ?? user?.email ?? "—"}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={resetForm} disabled={!isDirty || saving} style={{ minHeight: 38, padding: "8px 13px", borderRadius: 9, border: "1px solid var(--border)", background: "transparent", color: "var(--text-soft)", fontFamily: fonts.body, fontSize: 13, fontWeight: 700, cursor: !isDirty || saving ? "not-allowed" : "pointer", opacity: !isDirty || saving ? 0.55 : 1 }}>
                  Descartar
                </button>
                <button type="submit" disabled={!isDirty || saving || Object.keys(errors).length > 0} style={{ minHeight: 38, padding: "8px 15px", borderRadius: 9, border: "none", background: "var(--accent)", color: "var(--accent-contrast)", fontFamily: fonts.body, fontSize: 13, fontWeight: 850, cursor: !isDirty || saving ? "not-allowed" : "pointer", opacity: !isDirty || saving ? 0.55 : 1 }}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
