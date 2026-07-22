"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PASSWORD_REQUIREMENTS } from "@/modules/identity/application/password";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";
import { AuthShell, backLink, button, description, errorStyle, heading, input, label, successStyle } from "@/components/auth/PasswordResetShell";
import { fonts } from "@/styles/tokens";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password !== confirmation) { setError("Las contraseñas no coinciden."); return; }
    setSubmitting(true);
    try {
      await httpClient("/api/password-reset/confirm", { method: "POST", body: { token, password } });
      setDone(true);
    } catch (cause) { setError(isHttpClientError(cause) ? cause.message : "No fue posible actualizar la contraseña."); }
    finally { setSubmitting(false); }
  }

  return <AuthShell>
    <h1 style={heading}>Crea una contraseña nueva</h1>
    <p style={description}>Elige una contraseña distinta y segura. Al guardarla cerraremos todas las sesiones anteriores de tu cuenta.</p>
    {!token ? <><p role="alert" style={errorStyle}>El enlace está incompleto o no es válido.</p><Link href="/forgot-password" style={backLink}>Solicitar un enlace nuevo</Link></> : done ? <><div role="status" style={successStyle}>Tu contraseña fue actualizada correctamente.</div><Link href="/login" style={{ ...button, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>Iniciar sesión</Link></> :
      <form onSubmit={submit} style={{ display: "grid", gap: ".85rem" }}>
        <div><label htmlFor="password" style={label}>Nueva contraseña</label><input id="password" type="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} style={input} /></div>
        <div><label htmlFor="confirmation" style={label}>Confirmar contraseña</label><input id="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} style={input} /></div>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "grid", gap: 3, color: "var(--text-soft)", fontSize: 12, fontFamily: fonts.body }}>
          {PASSWORD_REQUIREMENTS.map(rule => <li key={rule.id} style={{ color: rule.isMet(password) ? "var(--gain)" : "var(--text-soft)" }}>{rule.label}</li>)}
        </ul>
        {error ? <p role="alert" style={errorStyle}>{error}</p> : null}
        <button disabled={submitting} style={button}>{submitting ? "Guardando..." : "Guardar nueva contraseña"}</button>
      </form>}
    <Link href="/login" style={backLink}>← Volver a iniciar sesión</Link>
  </AuthShell>;
}

export default function ResetPasswordPage() { return <Suspense><ResetForm /></Suspense>; }
