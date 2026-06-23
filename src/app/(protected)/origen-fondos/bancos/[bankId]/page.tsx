"use client";

import { useEffect, useRef, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { speakResponse, stopSpeaking } from "@/modules/voice/textToSpeech";
import { startListening } from "@/modules/voice/speechToText";
import { VoiceOrb } from "@/components/voice/VoiceOrb";
import type { VoiceEngineState } from "@/modules/voice/voiceEngine";
import { findBankById, getBankLogoUrl } from "@/modules/banking/catalogs/chileBanks";
import type { ConnectionMethod } from "@/modules/banking/catalogs/chileBanks";

type AssistantStatus = "idle" | "listening" | "speaking";

const METHOD_META: Record<ConnectionMethod, { icon: string; label: string; cta: string; accent: string; bg: string; border: string }> = {
  api: {
    icon: "🔐",
    label: "Conexión segura por API",
    cta: "Configurar API →",
    accent: "#7C3AED",
    bg: "#FBFAFF",
    border: "#E6E0FF",
  },
  manual_upload: {
    icon: "📄",
    label: "Subir cartola bancaria",
    cta: "Subir archivo →",
    accent: "#20C878",
    bg: "#F8FFFB",
    border: "#D9F5E8",
  },
};

function statusCopy(status: AssistantStatus) {
  if (status === "listening") return "Escuchando...";
  if (status === "speaking") return "Hablando...";
  return "LEDGERA te escucha";
}

export default function BankConnectionPage() {
  const params = useParams<{ bankId: string }>();
  const bank = findBankById(params.bankId);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [activeMethod, setActiveMethod] = useState<ConnectionMethod | null>(null);
  const [apiClientId, setApiClientId] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [apiToken, setApiToken] = useState("");

  if (!bank) notFound();

  const isAvailable = bank.status === "available";
  const guide = `Estás en la conexión con ${bank.name}. Selecciona el método de conexión para continuar.`;

  useEffect(() => {
    setStatus("speaking");
    void speakResponse(guide).finally(() => setStatus("idle"));
    return () => { stopSpeaking(); stopListeningRef.current?.(); };
  }, [guide]);

  function orbState(): VoiceEngineState | "listening" {
    if (status === "speaking") return "playing";
    if (status === "listening") return "listening";
    return "idle";
  }

  function toggleMic() {
    if (status === "listening") { stopListeningRef.current?.(); setStatus("idle"); return; }
    stopSpeaking();
    const stop = startListening({
      onResult: ({ transcript }) => setQuery(transcript),
      onStateChange: (state) => setStatus(state === "listening" ? "listening" : "idle"),
      onError: () => setStatus("idle"),
    });
    if (stop) { stopListeningRef.current = stop; setStatus("listening"); }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    setStatus("speaking");
    void speakResponse(`Continuamos con ${bank!.name}.`).finally(() => setStatus("idle"));
  }

  function handleMethod(method: ConnectionMethod) {
    setActiveMethod(method);
    if (method === "manual_upload") fileInputRef.current?.click();
  }

  function connectApi(event: React.FormEvent) {
    event.preventDefault();
    setStatus("speaking");
    void speakResponse(`Configuración API recibida para ${bank!.name}. Validaremos las credenciales en modo seguro.`).finally(() => setStatus("idle"));
  }

  return (
    <main style={{ height: "calc(100vh - 92px)", overflow: "hidden", display: "grid", gap: 10, gridTemplateRows: "auto auto 1fr auto" }}>
      <section>
        <button
          onClick={() => window.location.href = "/origen-fondos/bancos"}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "#475569", fontSize: 13, fontFamily: fonts.body, padding: 0, marginBottom: 4 }}
        >
          ← Volver a Bancos
        </button>
      </section>

      <section style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <img src={getBankLogoUrl(bank.domain)} alt={bank.name} style={{ width: 58, height: 48, objectFit: "contain", display: "block" }} />
        <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.35rem,2.4vw,1.72rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.04em", fontFamily: fonts.display }}>
          Conectar {bank.shortName}
        </h1>
      </section>

      <section style={{ minHeight: 0, overflow: "hidden", display: "grid", gap: 10, gridTemplateRows: "auto 1fr" }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", alignContent: "start" }}>
          {bank.connectionMethods.map((method) => {
            const meta = METHOD_META[method];
            const active = activeMethod === method;
            return (
              <button
                key={method}
                type="button"
                disabled={!isAvailable}
                onClick={() => handleMethod(method)}
                style={{ minHeight: 106, borderRadius: 18, border: `1px solid ${active ? meta.accent : meta.border}`, background: meta.bg, color: "#0F2A3D", cursor: isAvailable ? "pointer" : "not-allowed", display: "grid", gap: 8, padding: "16px", textAlign: "left", fontFamily: fonts.body, opacity: isAvailable ? 1 : 0.55, boxShadow: active ? `0 8px 20px ${meta.accent}18` : "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{meta.icon}</span>
                  <strong style={{ fontSize: 15, fontWeight: 900 }}>{meta.label}</strong>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: meta.accent }}>{meta.cta}</span>
              </button>
            );
          })}
        </div>

        <div style={{ minHeight: 0, border: "1px solid #E2E8F0", borderRadius: 18, background: "#FFFFFF", padding: 14, fontFamily: fonts.body, overflow: "hidden" }}>
          {!activeMethod && (
            <p style={{ margin: 0, color: "#64748B", fontSize: 13 }}>Selecciona un conector para mostrar sus comandos.</p>
          )}

          {activeMethod === "api" && (
            <form onSubmit={connectApi} style={{ display: "grid", gap: 10 }}>
              <strong style={{ color: "#0F2A3D", fontSize: 15 }}>Configurar API de {bank.shortName}</strong>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr)) auto", gap: 8, alignItems: "center" }}>
                <input value={apiClientId} onChange={(event) => setApiClientId(event.target.value)} placeholder="Client ID / Usuario API" style={{ minHeight: 42, borderRadius: 12, border: "1px solid #CBD5E1", padding: "0 12px", fontFamily: fonts.body }} />
                <input value={apiSecret} onChange={(event) => setApiSecret(event.target.value)} placeholder="Secret / Llave privada" type="password" style={{ minHeight: 42, borderRadius: 12, border: "1px solid #CBD5E1", padding: "0 12px", fontFamily: fonts.body }} />
                <input value={apiToken} onChange={(event) => setApiToken(event.target.value)} placeholder="Token / API Key" type="password" style={{ minHeight: 42, borderRadius: 12, border: "1px solid #CBD5E1", padding: "0 12px", fontFamily: fonts.body }} />
                <button type="submit" style={{ minHeight: 42, borderRadius: 12, border: "none", background: "#7C3AED", color: "#FFFFFF", fontWeight: 900, padding: "0 16px", cursor: "pointer" }}>Conectar API</button>
              </div>
            </form>
          )}

          {activeMethod === "manual_upload" && (
            <div style={{ display: "grid", gap: 10 }}>
              <strong style={{ color: "#0F2A3D", fontSize: 15 }}>Subir cartola bancaria</strong>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: 220, minHeight: 42, borderRadius: 12, border: "none", background: "#20C878", color: "#FFFFFF", fontWeight: 900, cursor: "pointer" }}>Seleccionar archivo</button>
              <input ref={fileInputRef} type="file" hidden accept=".pdf,.csv,.xls,.xlsx,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
            </div>
          )}
        </div>
      </section>

      <section style={{ alignSelf: "end", border: "1px solid #DDD6FE", borderRadius: 20, background: "#FFFFFF", padding: 12, display: "grid", gridTemplateColumns: "minmax(260px,.85fr) minmax(320px,1.15fr)", gap: 14, alignItems: "center", boxShadow: "0 12px 28px rgba(109,74,255,0.05)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
          <div style={{ width: 52, height: 52, overflow: "hidden", borderRadius: 999, flexShrink: 0 }}><VoiceOrb state={orbState()} /></div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block", color: status === "listening" || status === "speaking" ? "#5B35F5" : "#475569", fontSize: 15, fontWeight: 900, marginBottom: 4, fontFamily: fonts.body }}>{statusCopy(status)}</strong>
            <p style={{ margin: 0, color: "#475569", fontSize: 12.5, lineHeight: 1.28, fontFamily: fonts.body, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{guide}</p>
          </div>
        </div>

        <form onSubmit={submit}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, minHeight: 46, borderRadius: 15, border: "1px solid #CBD5E1", background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 6px 0 14px", gap: 6, minWidth: 0, boxShadow: "0 6px 14px rgba(15,42,61,0.035)" }}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Habla o escribe aquí..." style={{ flex: 1, border: "none", outline: "none", color: "#0F2A3D", fontSize: 14, fontFamily: fonts.body, minWidth: 0, background: "transparent" }} />
              <button type="button" onClick={toggleMic} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: status === "listening" ? "rgba(91,53,245,0.12)" : "transparent", color: status === "listening" ? "#5B35F5" : "#64748B", cursor: "pointer", fontSize: 20, display: "grid", placeItems: "center", flexShrink: 0 }}>{status === "listening" ? "■" : "🎙"}</button>
              <button type="submit" style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: "#7C3AED", color: "#FFFFFF", fontSize: 18, fontWeight: 900, cursor: "pointer", flexShrink: 0, display: "grid", placeItems: "center" }}>→</button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
