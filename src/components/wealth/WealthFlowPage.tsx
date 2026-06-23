"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { speakResponse, stopSpeaking } from "@/modules/voice/textToSpeech";
import { startListening } from "@/modules/voice/speechToText";
import { VoiceOrb } from "@/components/voice/VoiceOrb";
import type { VoiceEngineState } from "@/modules/voice/voiceEngine";

type WealthStepKey = "origen-fondos" | "activos";
type SourceOptionKey = "bancos" | "exchanges" | "wallets" | "documentacion";
type AssetViewKey = "transacciones" | "activos-detectados" | "pendientes" | "eventos-tributarios";
type AssistantStatus = "idle" | "listening" | "thinking" | "speaking";
type SourceOption = { key: SourceOptionKey; icon: string; label: string; hint: string; accent: string; bg: string; border: string };
type AssetView = { key: AssetViewKey; label: string; value: string; hint: string; accent: string; bg: string; border: string };

const SOURCE_OPTIONS: SourceOption[] = [
  { key: "bancos", icon: "🏦", label: "Bancos", hint: "Abrí Bancos. Selecciona tu banco para continuar.", accent: "#6D4AFF", bg: "#FBFAFF", border: "#E6E0FF" },
  { key: "exchanges", icon: "📊", label: "Exchanges", hint: "Abrí Exchanges. Selecciona tu exchange para continuar.", accent: "#20C878", bg: "#F8FFFB", border: "#D9F5E8" },
  { key: "wallets", icon: "💳", label: "Wallets", hint: "Abrí Wallets. Selecciona tu wallet para continuar.", accent: "#2483FF", bg: "#F8FBFF", border: "#DCEBFF" },
  { key: "documentacion", icon: "📄", label: "Documentación", hint: "Abrí Documentación. Puedes cargar PDF o Excel.", accent: "#FF7A1A", bg: "#FFFBF6", border: "#FFE8D6" },
];

const ASSET_VIEWS: AssetView[] = [
  { key: "transacciones", label: "Transacciones", value: "0", hint: "Todos los movimientos importados en una sola tabla.", accent: "#6D4AFF", bg: "#FBFAFF", border: "#E6E0FF" },
  { key: "activos-detectados", label: "Activos", value: "0", hint: "Saldos y activos detectados desde las fuentes.", accent: "#2483FF", bg: "#F8FBFF", border: "#DCEBFF" },
  { key: "pendientes", label: "Por revisar", value: "0", hint: "Datos que requieren corrección o confirmación.", accent: "#FF7A1A", bg: "#FFFBF6", border: "#FFE8D6" },
  { key: "eventos-tributarios", label: "Eventos tributarios", value: "0", hint: "Operaciones que podrían afectar impuestos.", accent: "#20C878", bg: "#F8FFFB", border: "#D9F5E8" },
];

const STEP_COPY: Record<WealthStepKey, { title: string; subtitle: string; guide: string; examples: string[] }> = {
  "origen-fondos": {
    title: "Origen de Fondos",
    subtitle: "Selecciona o indica cómo ingresaron tus fondos. Puedes hablar o escribir.",
    guide: "Estás en Origen de Fondos. Puedes decir Bancos, Exchanges, Wallets o Documentación. LEDGERA abrirá la opción correcta.",
    examples: ["bancos", "exchanges", "wallets", "documentación"],
  },
  activos: {
    title: "Activos",
    subtitle: "Revisa y corrige la información consolidada antes del análisis tributario.",
    guide: "Estás en Activos. Aquí revisas transacciones, activos detectados y datos pendientes antes de enviarlos al motor tributario.",
    examples: ["ver transacciones", "revisar pendientes", "eventos tributarios", "activos detectados"],
  },
};

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function resolveSourceIntent(text: string): SourceOptionKey | null {
  const clean = normalize(text);
  if (/banco|cuenta|cartola|deposito|transferencia/.test(clean)) return "bancos";
  if (/exchange|binance|coinbase|buda|plataforma/.test(clean)) return "exchanges";
  if (/wallet|direccion|on.?chain|transaccion|autocustodia/.test(clean)) return "wallets";
  if (/document|pdf|excel|archivo|xls|xlsx|subir/.test(clean)) return "documentacion";
  return null;
}

function resolveAssetView(text: string): AssetViewKey | null {
  const clean = normalize(text);
  if (/transaccion|movimiento|historial|operacion/.test(clean)) return "transacciones";
  if (/activo|saldo|posicion|token|moneda/.test(clean)) return "activos-detectados";
  if (/pendiente|corregir|correccion|clasificar|error|inconsistencia/.test(clean)) return "pendientes";
  if (/tributario|impuesto|evento|declaracion|renta/.test(clean)) return "eventos-tributarios";
  return null;
}

function statusCopy(status: AssistantStatus) {
  if (status === "listening") return "Escuchando...";
  if (status === "thinking") return "Analizando...";
  if (status === "speaking") return "Hablando...";
  return "LEDGERA te escucha";
}

function EmptyTransactionsTable() {
  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: 18, background: "#FFFFFF", overflow: "hidden", minHeight: 260 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr", padding: "11px 14px", background: "#F8FAFC", color: "#64748B", fontSize: 11, fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: fonts.body }}>
        <span>Fecha</span>
        <span>Fuente</span>
        <span>Activo</span>
        <span>Movimiento</span>
        <span>Estado</span>
        <span>Acción</span>
      </div>
      <div style={{ display: "grid", placeItems: "center", minHeight: 210, padding: 20, textAlign: "center", color: "#64748B", fontFamily: fonts.body }}>
        <div>
          <strong style={{ display: "block", color: "#0F2A3D", fontSize: 16, marginBottom: 6 }}>Aún no hay datos importados</strong>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>Cuando cargues bancos, exchanges, wallets o documentos, las transacciones aparecerán aquí para revisar y corregir.</p>
        </div>
      </div>
    </div>
  );
}

export function WealthFlowPage({ activeStep }: { activeStep: WealthStepKey }) {
  const router = useRouter();
  const stopListeningRef = useRef<(() => void) | null>(null);
  const [query, setQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<SourceOptionKey | null>(null);
  const [assetView, setAssetView] = useState<AssetViewKey>("transacciones");
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const copy = STEP_COPY[activeStep];
  const selectedSourceOption = SOURCE_OPTIONS.find((item) => item.key === selectedSource);
  const selectedAssetView = ASSET_VIEWS.find((item) => item.key === assetView) ?? ASSET_VIEWS[0];
  const activeVoice = status === "listening" || status === "speaking";

  useEffect(() => {
    setStatus("speaking");
    void speakResponse(copy.guide).finally(() => setStatus("idle"));
    return () => { stopSpeaking(); stopListeningRef.current?.(); };
  }, [copy.guide]);

  function openSourceOption(option: SourceOption, mode: "manual" | "auto") {
    stopSpeaking();
    stopListeningRef.current?.();
    setSelectedSource(option.key);
    setQuery(option.label);
    const sourceFundsRoutes: Record<SourceOptionKey, string> = {
      bancos: "/origen-fondos/bancos",
      exchanges: "/origen-fondos/exchanges",
      wallets: "/origen-fondos/wallets",
      documentacion: "/origen-fondos/documentacion",
    };
    setStatus("idle");
    router.push(sourceFundsRoutes[option.key]);
    if (mode === "auto") void speakResponse(option.hint).finally(() => setStatus("idle"));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    setStatus("thinking");

    if (activeStep === "origen-fondos") {
      const option = SOURCE_OPTIONS.find((item) => item.key === resolveSourceIntent(clean));
      if (option) { openSourceOption(option, "auto"); return; }
    }

    if (activeStep === "activos") {
      const view = resolveAssetView(clean);
      if (view) { setAssetView(view); setStatus("idle"); return; }
    }

    router.push(`/panel?q=${encodeURIComponent(clean)}&scope=wealth-flow&step=${activeStep}`);
  }

  function toggleMic() {
    if (status === "listening") { stopListeningRef.current?.(); setStatus("idle"); return; }
    stopSpeaking();
    const stop = startListening({
      onResult: ({ transcript, final }) => {
        setQuery(transcript);
        if (!final) return;
        if (activeStep === "origen-fondos") {
          const option = SOURCE_OPTIONS.find((item) => item.key === resolveSourceIntent(transcript));
          if (option) openSourceOption(option, "auto");
          return;
        }
        const view = resolveAssetView(transcript);
        if (view) setAssetView(view);
      },
      onStateChange: (state) => setStatus(state === "listening" ? "listening" : "idle"),
      onError: () => setStatus("idle"),
    });
    if (stop) { stopListeningRef.current = stop; setStatus("listening"); }
  }

  function orbState(): VoiceEngineState | "listening" {
    if (status === "speaking") return "playing";
    if (status === "listening") return "listening";
    return "idle";
  }

  if (activeStep === "activos") {
    return (
      <main style={{ height: "100%", minHeight: 0, overflow: "hidden", display: "grid", gap: 12, gridTemplateRows: "auto auto minmax(0,1fr) auto" }}>
        <section>
          <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.55rem,2.7vw,1.9rem)", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>{copy.title}</h1>
          <p style={{ color: "#334155", fontSize: 13.5, lineHeight: 1.32, margin: 0, fontFamily: fonts.body }}>{copy.subtitle}</p>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
          {ASSET_VIEWS.map((view) => {
            const active = assetView === view.key;
            return (
              <button key={view.key} type="button" onClick={() => setAssetView(view.key)} style={{ minHeight: 82, borderRadius: 18, border: `1px solid ${active ? view.accent : view.border}`, background: view.bg, cursor: "pointer", textAlign: "left", padding: "12px 14px", display: "grid", gap: 3, boxShadow: active ? `0 8px 18px ${view.accent}20` : "0 8px 16px rgba(15,42,61,0.035)", fontFamily: fonts.body }}>
                <span style={{ color: view.accent, fontSize: 21, fontWeight: 950, lineHeight: 1 }}>{view.value}</span>
                <strong style={{ color: "#0F2A3D", fontSize: 13.5, fontWeight: 900 }}>{view.label}</strong>
                <span style={{ color: "#64748B", fontSize: 11.5, lineHeight: 1.2 }}>{view.hint}</span>
              </button>
            );
          })}
        </section>

        <section style={{ minHeight: 0, overflowY: "auto", overflowX: "hidden", display: "grid", gap: 10, alignContent: "start", paddingBottom: 8 }}>
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 18, background: "#FFFFFF", padding: "12px 14px", fontFamily: fonts.body }}>
            <strong style={{ color: "#0F2A3D", fontSize: 15, fontWeight: 900 }}>{selectedAssetView.label}</strong>
            <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 12.5, lineHeight: 1.35 }}>{selectedAssetView.hint}</p>
          </div>
          <EmptyTransactionsTable />
        </section>

        <section style={{ alignSelf: "end", border: "1px solid #DDD6FE", borderRadius: 20, background: "#FFFFFF", padding: 12, display: "grid", gridTemplateColumns: "minmax(260px,.85fr) minmax(320px,1.15fr)", gap: 14, alignItems: "center", boxShadow: "0 12px 28px rgba(109,74,255,0.05)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
            <div style={{ width: 52, height: 52, overflow: "hidden", borderRadius: 999, flexShrink: 0 }}><VoiceOrb state={orbState()} /></div>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block", color: activeVoice ? "#5B35F5" : "#475569", fontSize: 15, fontWeight: 900, marginBottom: 4, fontFamily: fonts.body }}>{statusCopy(status)}</strong>
              <p style={{ margin: 0, color: "#475569", fontSize: 12.5, lineHeight: 1.28, fontFamily: fonts.body, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedAssetView.hint}</p>
            </div>
          </div>

          <form onSubmit={submit}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, minHeight: 46, borderRadius: 15, border: "1px solid #CBD5E1", background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 6px 0 14px", gap: 6, minWidth: 0, boxShadow: "0 6px 14px rgba(15,42,61,0.035)" }}>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar transacción, activo o pendiente..." style={{ flex: 1, border: "none", outline: "none", color: "#0F2A3D", fontSize: 14, fontFamily: fonts.body, minWidth: 0, background: "transparent" }} />
                <button type="button" onClick={toggleMic} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: status === "listening" ? "rgba(91,53,245,0.12)" : "transparent", color: status === "listening" ? "#5B35F5" : "#64748B", cursor: "pointer", fontSize: 20, display: "grid", placeItems: "center", flexShrink: 0 }}>{status === "listening" ? "■" : "🎙"}</button>
              </div>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main style={{ height: "calc(100vh - 160px)", overflow: "hidden", display: "grid", gap: 14, gridTemplateRows: "auto 110px 1fr" }}>
      <section>
        <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.65rem,3vw,2.05rem)", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>{copy.title}</h1>
        <p style={{ color: "#334155", fontSize: 14, lineHeight: 1.35, margin: 0, fontFamily: fonts.body }}>{copy.subtitle}</p>
      </section>

      <section style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}>
        {SOURCE_OPTIONS.map((option) => {
          const active = selectedSource === option.key;
          return (
            <button key={option.key} type="button" onClick={() => openSourceOption(option, "manual")} style={{ height: 110, borderRadius: 18, border: `1px solid ${active ? option.accent : option.border}`, background: option.bg, color: "#0F2A3D", cursor: "pointer", display: "grid", gap: 6, padding: "12px 10px", justifyItems: "center", alignItems: "center", alignContent: "center", boxShadow: active ? `0 8px 18px ${option.accent}20` : "0 8px 16px rgba(15,42,61,0.04)", fontFamily: fonts.body, textAlign: "center" }}>
              <span style={{ fontSize: 36, lineHeight: 1 }}>{option.icon}</span>
              <strong style={{ fontSize: 14, fontWeight: 900 }}>{option.label}</strong>
            </button>
          );
        })}
      </section>

      <section style={{ alignSelf: "end", border: "1px solid #DDD6FE", borderRadius: 20, background: "#FFFFFF", padding: 12, display: "grid", gridTemplateColumns: "minmax(260px,.85fr) minmax(320px,1.15fr)", gap: 14, alignItems: "center", boxShadow: "0 12px 28px rgba(109,74,255,0.05)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
          <div style={{ width: 52, height: 52, overflow: "hidden", borderRadius: 999, flexShrink: 0 }}><VoiceOrb state={orbState()} /></div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block", color: activeVoice ? "#5B35F5" : "#475569", fontSize: 15, fontWeight: 900, marginBottom: 4, fontFamily: fonts.body }}>{statusCopy(status)}</strong>
            <p style={{ margin: 0, color: "#475569", fontSize: 12.5, lineHeight: 1.28, fontFamily: fonts.body, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedSourceOption ? selectedSourceOption.hint : `Puedes decir: ${copy.examples.join(", ")}.`}</p>
          </div>
        </div>

        <form onSubmit={submit}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, minHeight: 46, borderRadius: 15, border: "1px solid #CBD5E1", background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 6px 0 14px", gap: 6, minWidth: 0, boxShadow: "0 6px 14px rgba(15,42,61,0.035)" }}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Habla o escribe aquí..." style={{ flex: 1, border: "none", outline: "none", color: "#0F2A3D", fontSize: 14, fontFamily: fonts.body, minWidth: 0, background: "transparent" }} />
              <button type="button" onClick={toggleMic} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: status === "listening" ? "rgba(91,53,245,0.12)" : "transparent", color: status === "listening" ? "#5B35F5" : "#64748B", cursor: "pointer", fontSize: 20, display: "grid", placeItems: "center", flexShrink: 0 }}>{status === "listening" ? "■" : "🎙"}</button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
