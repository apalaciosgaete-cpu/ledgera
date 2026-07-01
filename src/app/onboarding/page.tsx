"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";
import { fonts } from "@/styles/tokens";

// ─── Types ──────────────────────────────────────────────────────────────────

type ProfileType = "persona" | "empresa" | "profesional";
type OccupationType = "empleado" | "independiente" | "empresario" | "inversionista";
type TaxExperience = "si" | "no" | "no_estoy_seguro";
type CompanyType = "spa" | "ltda" | "eirl" | "sa" | "otra";
type ClientType = "personas" | "empresas" | "ambos";

type OnboardingData = {
  profileType?: ProfileType;
  primaryGoal?: string;
  // Persona
  occupationType?: OccupationType;
  assetCategories?: string[];
  taxExperience?: TaxExperience;
  // Empresa
  companyType?: CompanyType;
  taxRegimeKnown?: boolean;
  businessOperations?: string[];
  // Profesional
  specialty?: string;
  clientType?: ClientType;
};

type Step =
  | "WELCOME"
  | "PROFILE_TYPE"
  | "PRIMARY_GOAL"
  | "OCCUPATION"
  | "ASSETS"
  | "TAX_EXPERIENCE"
  | "COMPANY_TYPE"
  | "TAX_REGIME"
  | "BUSINESS_OPS"
  | "SPECIALTY"
  | "CLIENT_TYPE"
  | "SUMMARY"
  | "DONE";

type ChatMessage = {
  id: string;
  role: "ledgera" | "user";
  text: string;
};

// ─── Constants ──────────────────────────────────────────────────────────────

const PROFILE_TYPES: { value: ProfileType; label: string }[] = [
  { value: "persona", label: "Persona" },
  { value: "empresa", label: "Empresa" },
  { value: "profesional", label: "Profesional" },
];

const GOAL_EXAMPLES = [
  "Cryptoactivos",
  "Declaración tributaria",
  "Crear empresa",
  "Inversiones",
  "Patrimonio",
  "Cumplimiento",
];

const OCCUPATIONS: { value: OccupationType; label: string }[] = [
  { value: "empleado", label: "Empleado" },
  { value: "independiente", label: "Independiente" },
  { value: "empresario", label: "Empresario" },
  { value: "inversionista", label: "Inversionista" },
];

const ASSET_OPTIONS = [
  "Cryptoactivos",
  "Inmuebles",
  "Acciones",
  "Fondos",
  "Empresa",
  "Otro",
];

const TAX_OPTIONS: { value: TaxExperience; label: string }[] = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "no_estoy_seguro", label: "No estoy seguro" },
];

const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
  { value: "spa", label: "SpA" },
  { value: "ltda", label: "Ltda" },
  { value: "eirl", label: "EIRL" },
  { value: "sa", label: "SA" },
  { value: "otra", label: "Otra" },
];

const BUSINESS_OPS = [
  "Comercio",
  "Servicios",
  "Internacional",
  "Cryptoactivos",
  "Tecnología",
];

const SPECIALTIES = [
  "Contador",
  "Abogado",
  "Consultor",
  "Auditor",
  "Otro",
];

const CLIENT_TYPES: { value: ClientType; label: string }[] = [
  { value: "personas", label: "Personas" },
  { value: "empresas", label: "Empresas" },
  { value: "ambos", label: "Ambos" },
];

let msgIdCounter = 0;
function nextId() {
  return `msg_${++msgIdCounter}`;
}

function labelForProfileType(v: ProfileType) {
  return PROFILE_TYPES.find(o => o.value === v)?.label ?? v;
}
function labelForOccupation(v: OccupationType) {
  return OCCUPATIONS.find(o => o.value === v)?.label ?? v;
}
function labelForTax(v: TaxExperience) {
  return TAX_OPTIONS.find(o => o.value === v)?.label ?? v;
}
function labelForCompany(v: CompanyType) {
  return COMPANY_TYPES.find(o => o.value === v)?.label ?? v;
}
function labelForClient(v: ClientType) {
  return CLIENT_TYPES.find(o => o.value === v)?.label ?? v;
}

// ─── Typewriter hook ────────────────────────────────────────────────────────

function useTypewriter(fullText: string, speedMs = 22) {
  const [displayed, setDisplayed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed(0);
    setDone(false);
    if (!fullText) {
      setDone(true);
      return;
    }
    const interval = setInterval(() => {
      setDisplayed(prev => {
        const next = prev + 1;
        if (next >= fullText.length) {
          clearInterval(interval);
          setDone(true);
          return fullText.length;
        }
        return next;
      });
    }, speedMs);
    return () => clearInterval(interval);
  }, [fullText, speedMs]);

  return { text: fullText.slice(0, displayed), done };
}

// ─── Components ─────────────────────────────────────────────────────────────

function Bubble({ msg, typing }: { msg: ChatMessage; typing?: boolean }) {
  const { text, done } = useTypewriter(
    typing ? msg.text : "",
    22,
  );

  const isLedgera = msg.role === "ledgera";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isLedgera ? "flex-start" : "flex-end",
        padding: "4px 0",
        animation: "msgSlide 0.3s ease-out",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "13px 18px",
          borderRadius: isLedgera ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
          background: isLedgera ? "rgba(255,255,255,0.06)" : "rgba(22,163,74,0.2)",
          border: isLedgera
            ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(22,163,74,0.2)",
          color: isLedgera ? "var(--text-faint)" : "var(--text)",
          fontSize: 15,
          lineHeight: 1.55,
          fontFamily: fonts.body,
          fontWeight: isLedgera ? 400 : 600,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {typing ? text : msg.text}
        {typing && !done && (
          <span style={{ animation: "blink 0.7s infinite", marginLeft: 2, opacity: 0.6 }}>
            ▌
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("WELCOME");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [data, setData] = useState<OnboardingData>({});
  const [showOptions, setShowOptions] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [goalFocused, setGoalFocused] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedBizOps, setSelectedBizOps] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Redirect if already completed
  useEffect(() => {
    if (!isLoading && user && user.needsOnboarding === false) {
      router.replace("/panel");
    }
  }, [isLoading, user, router]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, showOptions]);

  function addLedgeraMsg(text: string) {
    setMessages(prev => [...prev, { id: nextId(), role: "ledgera", text }]);
  }

  function addUserMsg(text: string) {
    setMessages(prev => [...prev, { id: nextId(), role: "user", text }]);
  }

  const TYPING_SPEED_MS = 22;

  function advance(
    nextStep: Step,
    ledgeraText: string,
    delayMs = 400,
  ) {
    setShowOptions(false);
    setTimeout(() => {
      addLedgeraMsg(ledgeraText);
      setStep(nextStep);
      setTimeout(() => setShowOptions(true), 300 + ledgeraText.length * TYPING_SPEED_MS);
    }, delayMs);
  }

  // ── Handlers per step ──────────────────────────────────────────────────

  function handleWelcome() {
    setShowOptions(false);
    addLedgeraMsg("¿Cómo te gustaría usar LEDGERA?");
    setStep("PROFILE_TYPE");
    setTimeout(() => setShowOptions(true), 1500);
  }

  function handleProfileType(value: ProfileType) {
    setData(prev => ({ ...prev, profileType: value }));
    const label = labelForProfileType(value);
    addUserMsg(label);
    advance("PRIMARY_GOAL", "¿Qué te gustaría resolver primero?", 800);
  }

  function handleGoalSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const q = goalText.trim();
    if (!q) return;
    addUserMsg(q);
    setData(prev => ({ ...prev, primaryGoal: q }));
    setGoalText("");

    const profileType = data.profileType;
    if (profileType === "persona") {
      setTimeout(() => {
        addLedgeraMsg("¿Cuál describe mejor tu situación?");
        setStep("OCCUPATION");
        setTimeout(() => setShowOptions(true), 1500);
      }, 800);
    } else if (profileType === "empresa") {
      setTimeout(() => {
        addLedgeraMsg("¿Qué tipo de empresa tienes?");
        setStep("COMPANY_TYPE");
        setTimeout(() => setShowOptions(true), 1500);
      }, 800);
    } else if (profileType === "profesional") {
      setTimeout(() => {
        addLedgeraMsg("¿Cuál es tu especialidad?");
        setStep("SPECIALTY");
        setTimeout(() => setShowOptions(true), 1500);
      }, 800);
    }
  }

  function handleOccupation(value: OccupationType) {
    setData(prev => ({ ...prev, occupationType: value }));
    addUserMsg(labelForOccupation(value));
    setShowOptions(false);
    setTimeout(() => {
      addLedgeraMsg("¿Tienes alguno de estos activos?");
      setStep("ASSETS");
      setTimeout(() => setShowOptions(true), 1500);
    }, 800);
  }

  function handleAssetsConfirm() {
    const items = selectedAssets.length > 0 ? selectedAssets : ["No tengo activos"];
    addUserMsg(items.join(", "));
    setData(prev => ({ ...prev, assetCategories: selectedAssets }));
    setShowOptions(false);
    setTimeout(() => {
      addLedgeraMsg("¿Has presentado declaraciones tributarias anteriormente?");
      setStep("TAX_EXPERIENCE");
      setTimeout(() => setShowOptions(true), 1500);
    }, 800);
  }

  function handleTaxExperience(value: TaxExperience) {
    setData(prev => ({ ...prev, taxExperience: value }));
    addUserMsg(labelForTax(value));
    setShowOptions(false);
    setTimeout(() => showSummary(), 800);
  }

  function handleCompanyType(value: CompanyType) {
    setData(prev => ({ ...prev, companyType: value }));
    addUserMsg(labelForCompany(value));
    setShowOptions(false);
    setTimeout(() => {
      addLedgeraMsg("¿Conoces tu régimen tributario?");
      setStep("TAX_REGIME");
      setTimeout(() => setShowOptions(true), 1500);
    }, 800);
  }

  function handleTaxRegime(value: boolean) {
    setData(prev => ({ ...prev, taxRegimeKnown: value }));
    addUserMsg(value ? "Sí" : "No");
    setShowOptions(false);
    setTimeout(() => {
      addLedgeraMsg("¿Tu empresa opera con alguno de estos elementos?");
      setStep("BUSINESS_OPS");
      setTimeout(() => setShowOptions(true), 1500);
    }, 800);
  }

  function handleBizOpsConfirm() {
    const items = selectedBizOps.length > 0 ? selectedBizOps : ["Ninguna en particular"];
    addUserMsg(items.join(", "));
    setData(prev => ({ ...prev, businessOperations: selectedBizOps }));
    setShowOptions(false);
    setTimeout(() => showSummary(), 800);
  }

  function handleSpecialty(value: string) {
    setData(prev => ({ ...prev, specialty: value }));
    addUserMsg(value);
    setShowOptions(false);
    setTimeout(() => {
      addLedgeraMsg("¿Con qué tipo de clientes trabajas?");
      setStep("CLIENT_TYPE");
      setTimeout(() => setShowOptions(true), 1500);
    }, 800);
  }

  function handleClientType(value: ClientType) {
    setData(prev => ({ ...prev, clientType: value }));
    addUserMsg(labelForClient(value));
    setShowOptions(false);
    setTimeout(() => showSummary(), 800);
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  function showSummary() {
    addLedgeraMsg("Esto es lo que entendí de tu situación:");
    // Give the user time to see the typing animation before showing the summary card
    setTimeout(() => {
      setStep("SUMMARY");
    }, 1200);
  }

  function buildSummaryItems(): { label: string; value: string }[] {
    const items: { label: string; value: string }[] = [];
    if (data.profileType) items.push({ label: "Perfil", value: labelForProfileType(data.profileType) });
    if (data.primaryGoal) items.push({ label: "Objetivo", value: data.primaryGoal });
    if (data.occupationType) items.push({ label: "Situación", value: labelForOccupation(data.occupationType) });
    if (data.assetCategories && data.assetCategories.length > 0) {
      items.push({ label: "Activos", value: data.assetCategories.join(", ") });
    }
    if (data.taxExperience) items.push({ label: "Experiencia tributaria", value: labelForTax(data.taxExperience) });
    if (data.companyType) items.push({ label: "Tipo de empresa", value: labelForCompany(data.companyType) });
    if (data.taxRegimeKnown !== undefined) items.push({ label: "Régimen conocido", value: data.taxRegimeKnown ? "Sí" : "No" });
    if (data.businessOperations && data.businessOperations.length > 0) {
      items.push({ label: "Operaciones", value: data.businessOperations.join(", ") });
    }
    if (data.specialty) items.push({ label: "Especialidad", value: data.specialty });
    if (data.clientType) items.push({ label: "Clientes", value: labelForClient(data.clientType) });
    return items;
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ onboardingData: data }),
      });
      const json = await res.json();
      if (!json.ok) {
        setSaveError(json.message || "Error al guardar.");
        setSaving(false);
        return;
      }
      await refreshUser();
      setStep("DONE");
    } catch {
      setSaveError("Error de conexión. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit() {
    setMessages([]);
    setData({});
    setShowOptions(false);
    setGoalText("");
    setSelectedAssets([]);
    setSelectedBizOps([]);
    setStep("WELCOME");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading || !user) {
    return (
      <div style={fullScreenStyle}>
        <p style={{ color: "var(--text)", fontSize: 14 }}>Cargando…</p>
      </div>
    );
  }

  const summaryItems = buildSummaryItems();

  return (
    <div style={fullScreenStyle}>
      {/* Injected keyframes */}
      <style>{`
        @keyframes msgSlide {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.3); }
          50%      { box-shadow: 0 0 0 6px rgba(22,163,74,0); }
        }
      `}</style>

      {/* ── LEDGERA branding ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        zIndex: 10,
        display: "flex", justifyContent: "center",
        padding: "28px 24px 0",
      }}>
        <Logo variant="light" size="md" showSubtitle={false} />
      </div>

      {/* ── WELCOME screen ── */}
      {step === "WELCOME" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            flex: 1,
            padding: "0 24px",
            animation: "fadeUp 0.6s ease-out",
          }}
        >
          <p style={{
            color: "var(--text)", fontSize: 11, fontWeight: 850,
            letterSpacing: "0.12em", textTransform: "uppercase",
            margin: "0 0 12px", fontFamily: fonts.body,
          }}>
            Sistema Operativo Financiero y Tributario
          </p>

          <h1 style={{
            color: "var(--text)",
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
            fontWeight: 800,
            margin: "0 0 10px",
            lineHeight: 1.15,
            fontFamily: fonts.body,
            letterSpacing: "-0.01em",
          }}>
            Hola.
          </h1>

          <p style={{
            color: "var(--text-soft)",
            fontSize: 16,
            lineHeight: 1.6,
            margin: "0 auto 36px",
            maxWidth: 480,
          }}>
            Cuéntame sobre tu situación para entender cómo
            <br />
            puedo ayudarte mejor.
          </p>

          <button
            onClick={handleWelcome}
            style={{
              background: "var(--accent)",
              border: "none",
              borderRadius: 12,
              color: "var(--text)",
              cursor: "pointer",
              padding: "14px 40px",
              fontSize: 16,
              fontWeight: 800,
              fontFamily: fonts.body,
              transition: "background 0.15s, transform 0.15s",
              animation: "pulseGlow 2s ease-in-out infinite",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#3FA687";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#3FA687";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Comenzar
          </button>
        </div>
      )}

      {/* ── CHAT area (all steps except WELCOME, SUMMARY after msg, DONE) ── */}
      {step !== "WELCOME" && step !== "DONE" && (
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            width: "100%",
            maxWidth: 600,
            margin: "0 auto",
            padding: "100px 20px 200px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div>
            {messages.map((msg, i) => (
              <Bubble
                key={msg.id}
                msg={msg}
                typing={
                  msg.role === "ledgera" &&
                  i === messages.length - 1 &&
                  step !== "SUMMARY"
                }
              />
            ))}
          </div>

          {/* ── Options / Input area ── */}
          {showOptions && (
            <div style={{ animation: "fadeUp 0.35s ease-out", marginTop: 8 }}>
              {/* PROFILE_TYPE */}
              {step === "PROFILE_TYPE" && (
                <OptionsRow
                  options={PROFILE_TYPES.map(o => ({ label: o.label, value: o.value }))}
                  onClick={(v) => handleProfileType(v as ProfileType)}
                />
              )}

              {/* PRIMARY_GOAL */}
              {step === "PRIMARY_GOAL" && (
                <div>
                  <div style={{
                    display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14,
                    justifyContent: "center",
                  }}>
                    {GOAL_EXAMPLES.map(ex => (
                      <button
                        key={ex}
                        onClick={() => {
                          setGoalText(ex);
                          setTimeout(() => handleGoalSubmit(), 100);
                        }}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 999,
                          color: "var(--text)",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 500,
                          padding: "6px 16px",
                          fontFamily: fonts.body,
                          transition: "color 0.15s, border-color 0.15s, background 0.15s",
                        }}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={handleGoalSubmit} style={{ display: "flex", gap: 8 }}>
                    <input
                      value={goalText}
                      onChange={e => setGoalText(e.target.value)}
                      onFocus={() => setGoalFocused(true)}
                      onBlur={() => setGoalFocused(false)}
                      placeholder="Escribe tu objetivo..."
                      autoComplete="off"
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${goalFocused ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 12,
                        color: "var(--text)",
                        fontSize: 15,
                        fontFamily: fonts.body,
                        fontWeight: 500,
                        padding: "12px 16px",
                        outline: "none",
                        caretColor: "var(--accent)",
                        transition: "border-color 0.2s",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!goalText.trim()}
                      style={{
                        background: goalText.trim() ? "var(--accent)" : "rgba(255,255,255,0.06)",
                        border: "none",
                        borderRadius: 12,
                        color: "var(--text)",
                        cursor: goalText.trim() ? "pointer" : "default",
                        padding: "12px 18px",
                        fontSize: 17,
                        fontWeight: 800,
                        opacity: goalText.trim() ? 1 : 0.4,
                        transition: "background 0.15s",
                        lineHeight: 1,
                      }}
                    >
                      →
                    </button>
                  </form>
                </div>
              )}

              {/* OCCUPATION */}
              {step === "OCCUPATION" && (
                <OptionsRow
                  options={OCCUPATIONS.map(o => ({ label: o.label, value: o.value }))}
                  onClick={(v) => handleOccupation(v as OccupationType)}
                />
              )}

              {/* ASSETS (multi-select) */}
              {step === "ASSETS" && (
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, justifyContent: "center" }}>
                    {ASSET_OPTIONS.map(asset => {
                      const selected = selectedAssets.includes(asset);
                      return (
                        <button
                          key={asset}
                          onClick={() => {
                            setSelectedAssets(prev =>
                              prev.includes(asset)
                                ? prev.filter(a => a !== asset)
                                : [...prev, asset]
                            );
                          }}
                          style={{
                            background: selected ? "rgba(22,163,74,0.18)" : "rgba(255,255,255,0.04)",
                            border: selected
                              ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 999,
                            color: selected ? "var(--text)" : "var(--text)",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: selected ? 700 : 500,
                            padding: "7px 18px",
                            fontFamily: fonts.body,
                            transition: "all 0.15s",
                          }}
                        >
                          {selected ? "✓ " : ""}{asset}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleAssetsConfirm}
                    style={{
                      display: "block",
                      margin: "0 auto",
                      background: "var(--accent)",
                      border: "none",
                      borderRadius: 10,
                      color: "var(--text)",
                      cursor: "pointer",
                      padding: "10px 28px",
                      fontSize: 14,
                      fontWeight: 800,
                      fontFamily: fonts.body,
                      transition: "background 0.15s",
                    }}
                  >
                    Confirmar
                  </button>
                </div>
              )}

              {/* TAX_EXPERIENCE */}
              {step === "TAX_EXPERIENCE" && (
                <OptionsRow
                  options={TAX_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
                  onClick={(v) => handleTaxExperience(v as TaxExperience)}
                />
              )}

              {/* COMPANY_TYPE */}
              {step === "COMPANY_TYPE" && (
                <OptionsRow
                  options={COMPANY_TYPES.map(o => ({ label: o.label, value: o.value }))}
                  onClick={(v) => handleCompanyType(v as CompanyType)}
                />
              )}

              {/* TAX_REGIME */}
              {step === "TAX_REGIME" && (
                <OptionsRow
                  options={[
                    { label: "Sí", value: "true" },
                    { label: "No", value: "false" },
                  ]}
                  onClick={(v) => handleTaxRegime(v === "true")}
                />
              )}

              {/* BUSINESS_OPS (multi-select) */}
              {step === "BUSINESS_OPS" && (
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, justifyContent: "center" }}>
                    {BUSINESS_OPS.map(op => {
                      const selected = selectedBizOps.includes(op);
                      return (
                        <button
                          key={op}
                          onClick={() => {
                            setSelectedBizOps(prev =>
                              prev.includes(op)
                                ? prev.filter(o => o !== op)
                                : [...prev, op]
                            );
                          }}
                          style={{
                            background: selected ? "rgba(22,163,74,0.18)" : "rgba(255,255,255,0.04)",
                            border: selected
                              ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 999,
                            color: selected ? "var(--text)" : "var(--text)",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: selected ? 700 : 500,
                            padding: "7px 18px",
                            fontFamily: fonts.body,
                            transition: "all 0.15s",
                          }}
                        >
                          {selected ? "✓ " : ""}{op}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleBizOpsConfirm}
                    style={{
                      display: "block",
                      margin: "0 auto",
                      background: "var(--accent)",
                      border: "none",
                      borderRadius: 10,
                      color: "var(--text)",
                      cursor: "pointer",
                      padding: "10px 28px",
                      fontSize: 14,
                      fontWeight: 800,
                      fontFamily: fonts.body,
                      transition: "background 0.15s",
                    }}
                  >
                    Confirmar
                  </button>
                </div>
              )}

              {/* SPECIALTY */}
              {step === "SPECIALTY" && (
                <OptionsRow
                  options={SPECIALTIES.map(s => ({ label: s, value: s }))}
                  onClick={handleSpecialty}
                />
              )}

              {/* CLIENT_TYPE */}
              {step === "CLIENT_TYPE" && (
                <OptionsRow
                  options={CLIENT_TYPES.map(o => ({ label: o.label, value: o.value }))}
                  onClick={(v) => handleClientType(v as ClientType)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SUMMARY screen ── */}
      {step === "SUMMARY" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            maxWidth: 520,
            margin: "0 auto",
            padding: "100px 20px 40px",
            animation: "fadeUp 0.5s ease-out",
          }}
        >
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: "32px 28px",
            width: "100%",
          }}>
            <p style={{
              color: "var(--text)", fontSize: 11, fontWeight: 850,
              letterSpacing: "0.09em", textTransform: "uppercase",
              margin: "0 0 22px", fontFamily: fonts.body,
            }}>
              Esto es lo que entendí
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {summaryItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 12,
                    paddingBottom: 12,
                    borderBottom: i < summaryItems.length - 1
                      ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <span style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.4 }}>
                    {item.label}
                  </span>
                  <span style={{
                    color: "var(--text)", fontSize: 14, fontWeight: 700,
                    textAlign: "right", maxWidth: "60%",
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              display: "flex", gap: 12, marginTop: 28,
              justifyContent: "center",
            }}>
              <button
                onClick={handleEdit}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  color: "var(--text-soft)",
                  cursor: "pointer",
                  padding: "11px 24px",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: fonts.body,
                  transition: "border-color 0.15s, color 0.15s",
                }}
              >
                Editar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saving ? "var(--accent)" : "var(--accent)",
                  border: "none",
                  borderRadius: 10,
                  color: "var(--text)",
                  cursor: saving ? "not-allowed" : "pointer",
                  padding: "11px 28px",
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: fonts.body,
                  transition: "background 0.15s",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Guardando…" : "Continuar"}
              </button>
            </div>

            {saveError && (
              <p style={{
                color: "var(--loss)", fontSize: 13, margin: "16px 0 0",
                textAlign: "center",
              }}>
                {saveError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── DONE screen ── */}
      {step === "DONE" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 24px",
            animation: "fadeUp 0.6s ease-out",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <h2 style={{
            color: "var(--text)",
            fontSize: "clamp(1.4rem, 3.5vw, 2rem)",
            fontWeight: 800,
            margin: "0 0 10px",
            lineHeight: 1.15,
            fontFamily: fonts.body,
          }}>
            Ya tienes tu espacio LEDGERA configurado.
          </h2>
          <p style={{
            color: "var(--text-soft)",
            fontSize: 15,
            lineHeight: 1.6,
            margin: "0 auto 32px",
            maxWidth: 420,
          }}>
            Ahora puedes comenzar una conversación o revisar tu situación actual.
          </p>
          <button
            onClick={() => router.push("/panel")}
            style={{
              background: "var(--accent)",
              border: "none",
              borderRadius: 12,
              color: "var(--text)",
              cursor: "pointer",
              padding: "14px 40px",
              fontSize: 16,
              fontWeight: 800,
              fontFamily: fonts.body,
              transition: "background 0.15s, transform 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#3FA687";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#3FA687";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Ir a mi espacio →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Option pills component ────────────────────────────────────────────────

function OptionsRow({
  options,
  onClick,
}: {
  options: { label: string; value: string }[];
  onClick: (value: string) => void;
}) {
  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "center",
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onClick(opt.value)}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 999,
            color: "var(--text-faint)",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
            padding: "10px 24px",
            fontFamily: fonts.body,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(22,163,74,0.14)";
            e.currentTarget.style.borderColor = "rgba(74,222,128,0.3)";
            e.currentTarget.style.color = "var(--text)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
            e.currentTarget.style.color = "var(--text-soft)";
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Shared styles ─────────────────────────────────────────────────────────

const fullScreenStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg-sunken)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  fontFamily: fonts.body,
  position: "relative",
};
