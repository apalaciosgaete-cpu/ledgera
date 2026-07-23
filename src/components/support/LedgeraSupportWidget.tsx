"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CONSENT_EVENT,
  readConsentSnapshot,
  type ConsentSnapshot,
} from "@/lib/privacy/consent";
import { useAuth } from "@/modules/identity/client/authContext";
import {
  buildAssistantReply,
  buildNextStepReply,
  type AssistantContext,
  type AssistantLink,
} from "./assistantEngine";

type Position = {
  x: number;
  y: number;
};

type WidgetView = "assistant" | "feedback";
type ContextStatus = "idle" | "loading" | "ready" | "unavailable";

type StoredWidgetState = {
  collapsed: boolean;
  position: Position | null;
  activeView: WidgetView;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  links?: AssistantLink[];
  meta?: string;
};

type RouteContext = {
  label: string;
  description: string;
};

type AssistantContextResponse = {
  ok?: boolean;
  data?: AssistantContext;
};

const STORAGE_KEY = "ledgera-support-widget-v1";
const VIEWPORT_MARGIN = 12;
const DRAG_THRESHOLD = 4;
const CONTEXT_TTL_MS = 60_000;

function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Position>;
  return Number.isFinite(candidate.x) && Number.isFinite(candidate.y);
}

function isWidgetView(value: unknown): value is WidgetView {
  return value === "assistant" || value === "feedback";
}

function readStoredWidgetState(): StoredWidgetState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredWidgetState>;
    return {
      collapsed: parsed.collapsed === true,
      position: isPosition(parsed.position) ? parsed.position : null,
      activeView: isWidgetView(parsed.activeView) ? parsed.activeView : "assistant",
    };
  } catch {
    return null;
  }
}

function removeStoredWidgetState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function getRouteContext(pathname: string): RouteContext {
  if (pathname.startsWith("/importaciones") || pathname.startsWith("/import/")) {
    return {
      label: "Importaciones",
      description: "Aquí incorporas, revisas y confirmas movimientos provenientes de exchanges o archivos.",
    };
  }

  if (pathname.startsWith("/cryptoactivos")) {
    return {
      label: "Activos",
      description: "Aquí revisas los activos detectados, su costo y la trazabilidad de las operaciones.",
    };
  }

  if (pathname.startsWith("/obligaciones-tributarias")) {
    return {
      label: "Obligaciones tributarias",
      description: "Aquí LEDGERA presenta el resultado preliminar y los antecedentes que requieren revisión.",
    };
  }

  if (pathname.startsWith("/declaraciones")) {
    return {
      label: "Declaraciones",
      description: "Aquí generas y revisas respaldos PDF y Excel a partir de información confirmada.",
    };
  }

  if (pathname.startsWith("/configuracion/seguridad")) {
    return {
      label: "Seguridad",
      description: "Aquí administras contraseña, segundo factor y controles de acceso.",
    };
  }

  if (pathname.startsWith("/panel")) {
    return {
      label: "Panel principal",
      description: "Aquí tienes una vista resumida del avance y del estado general de la cuenta.",
    };
  }

  return {
    label: "LEDGERA",
    description: "Puedo identificar tu etapa actual, explicar resultados y llevarte a la siguiente acción correcta.",
  };
}

function statusLabel(status: ContextStatus, isAuthenticated: boolean): string {
  if (!isAuthenticated) return "Orientación general";
  if (status === "loading") return "Analizando tu cuenta";
  if (status === "ready") return "Contexto de cuenta activo";
  if (status === "unavailable") return "Contexto temporalmente no disponible";
  return "Preparando contexto";
}

export default function LedgeraSupportWidget() {
  const pathname = usePathname() || "/";
  const { isAuthenticated } = useAuth();
  const routeContext = useMemo(() => getRouteContext(pathname), [pathname]);

  const containerRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<Position | null>(null);
  const collapsedRef = useRef(false);
  const activeViewRef = useRef<WidgetView>("assistant");
  const canPersistRef = useRef(false);
  const ignoreNextClickRef = useRef(false);
  const messageIdRef = useRef(1);
  const assistantContextRef = useRef<AssistantContext | null>(null);
  const contextLoadedAtRef = useRef(0);
  const contextRequestRef = useRef<Promise<AssistantContext | null> | null>(null);
  const dragRef = useRef({
    pointerId: null as number | null,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    moved: false,
  });

  const [hydrated, setHydrated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<WidgetView>("assistant");
  const [position, setPosition] = useState<Position | null>(null);
  const [dragging, setDragging] = useState(false);
  const [input, setInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [assistantContext, setAssistantContext] = useState<AssistantContext | null>(null);
  const [contextStatus, setContextStatus] = useState<ContextStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Soy el Asistente LEDGERA. Puedo revisar en qué etapa estás, detectar qué te falta y explicarte cuál es la siguiente acción correcta.",
    },
  ]);

  const persistCurrentState = useCallback(() => {
    if (!canPersistRef.current) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          collapsed: collapsedRef.current,
          position: positionRef.current,
          activeView: activeViewRef.current,
        } satisfies StoredWidgetState),
      );
    } catch {}
  }, []);

  const clampPosition = useCallback((candidate: Position, width: number, height: number): Position => {
    const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
    const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);

    return {
      x: Math.min(Math.max(candidate.x, VIEWPORT_MARGIN), maxX),
      y: Math.min(Math.max(candidate.y, VIEWPORT_MARGIN), maxY),
    };
  }, []);

  const placeWithinViewport = useCallback((candidate: Position | null) => {
    const node = containerRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const fallback = {
      x: window.innerWidth - rect.width - 24,
      y: window.innerHeight - rect.height - 24,
    };
    const next = clampPosition(candidate || fallback, rect.width, rect.height);

    positionRef.current = next;
    setPosition(next);
  }, [clampPosition]);

  const refreshAssistantContext = useCallback(async (force = false): Promise<AssistantContext | null> => {
    if (!isAuthenticated) {
      assistantContextRef.current = null;
      contextLoadedAtRef.current = 0;
      setAssistantContext(null);
      setContextStatus("idle");
      return null;
    }

    const cached = assistantContextRef.current;
    if (!force && cached && Date.now() - contextLoadedAtRef.current < CONTEXT_TTL_MS) {
      return cached;
    }

    if (contextRequestRef.current) return contextRequestRef.current;

    const request = (async () => {
      setContextStatus("loading");
      try {
        const response = await fetch("/api/assistant/context", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Contexto no disponible (${response.status})`);

        const payload = (await response.json()) as AssistantContextResponse;
        if (!payload.ok || !payload.data) throw new Error("Respuesta de contexto inválida");

        assistantContextRef.current = payload.data;
        contextLoadedAtRef.current = Date.now();
        setAssistantContext(payload.data);
        setContextStatus("ready");
        return payload.data;
      } catch {
        setContextStatus("unavailable");
        return assistantContextRef.current;
      } finally {
        contextRequestRef.current = null;
      }
    })();

    contextRequestRef.current = request;
    return request;
  }, [isAuthenticated]);

  useEffect(() => {
    const consent = readConsentSnapshot();
    const canPersist = consent?.categories.functional === true;
    canPersistRef.current = canPersist;

    if (canPersist) {
      const stored = readStoredWidgetState();
      if (stored) {
        collapsedRef.current = stored.collapsed;
        positionRef.current = stored.position;
        activeViewRef.current = stored.activeView;
        setCollapsed(stored.collapsed);
        setPosition(stored.position);
        setActiveView(stored.activeView);
      }
    } else {
      removeStoredWidgetState();
    }

    setHydrated(true);

    function handleConsentUpdated(event: Event) {
      const snapshot = (event as CustomEvent<ConsentSnapshot>).detail;
      const nextCanPersist = snapshot?.categories.functional === true;
      canPersistRef.current = nextCanPersist;

      if (nextCanPersist) persistCurrentState();
      else removeStoredWidgetState();
    }

    window.addEventListener(CONSENT_EVENT, handleConsentUpdated);
    return () => window.removeEventListener(CONSENT_EVENT, handleConsentUpdated);
  }, [persistCurrentState]);

  useEffect(() => {
    if (!hydrated) return;
    void refreshAssistantContext(true);
  }, [hydrated, isAuthenticated, refreshAssistantContext]);

  useEffect(() => {
    if (!assistantContext || !isAuthenticated) return;

    setMessages((current) => {
      if (current.length !== 1 || current[0]?.id !== "welcome") return current;
      const reply = buildNextStepReply(assistantContext, true);
      return [
        {
          id: "welcome",
          role: "assistant",
          text: `Ya revisé el avance de tu cuenta. ${reply.text}`,
          links: reply.links,
          meta: reply.meta,
        },
      ];
    });
  }, [assistantContext, isAuthenticated]);

  useEffect(() => {
    if (!hydrated) return;

    const frame = window.requestAnimationFrame(() => {
      placeWithinViewport(positionRef.current);
      persistCurrentState();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeView, collapsed, hydrated, persistCurrentState, placeWithinViewport]);

  useEffect(() => {
    if (!hydrated) return;

    function handleResize() {
      placeWithinViewport(positionRef.current);
      persistCurrentState();
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hydrated, persistCurrentState, placeWithinViewport]);

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isResponding]);

  function setCollapsedState(nextCollapsed: boolean) {
    collapsedRef.current = nextCollapsed;
    setCollapsed(nextCollapsed);
    persistCurrentState();
  }

  function setView(nextView: WidgetView) {
    activeViewRef.current = nextView;
    setActiveView(nextView);
    persistCurrentState();
  }

  function beginDrag(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;

    const node = containerRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function moveDrag(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    const node = containerRef.current;
    if (!node) return;

    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= DRAG_THRESHOLD) {
      drag.moved = true;
    }

    const rect = node.getBoundingClientRect();
    const next = clampPosition(
      {
        x: event.clientX - drag.offsetX,
        y: event.clientY - drag.offsetY,
      },
      rect.width,
      rect.height,
    );

    positionRef.current = next;
    setPosition(next);
  }

  function endDrag(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    ignoreNextClickRef.current = drag.moved;
    dragRef.current.pointerId = null;
    setDragging(false);
    persistCurrentState();

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}

    window.setTimeout(() => {
      ignoreNextClickRef.current = false;
    }, 0);
  }

  function moveWithKeyboard(event: React.KeyboardEvent<HTMLElement>) {
    const current = positionRef.current;
    const node = containerRef.current;
    if (!current || !node) return;

    const step = event.shiftKey ? 32 : 12;
    let deltaX = 0;
    let deltaY = 0;

    switch (event.key) {
      case "ArrowLeft":
        deltaX = -step;
        break;
      case "ArrowRight":
        deltaX = step;
        break;
      case "ArrowUp":
        deltaY = -step;
        break;
      case "ArrowDown":
        deltaY = step;
        break;
      default:
        return;
    }

    event.preventDefault();

    const rect = node.getBoundingClientRect();
    const next = clampPosition(
      {
        x: current.x + deltaX,
        y: current.y + deltaY,
      },
      rect.width,
      rect.height,
    );

    positionRef.current = next;
    setPosition(next);
    persistCurrentState();
  }

  async function submitQuestion(question: string) {
    const trimmed = question.trim().slice(0, 500);
    if (!trimmed || isResponding) return;

    const userMessage: ChatMessage = {
      id: `user-${messageIdRef.current++}`,
      role: "user",
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage].slice(-18));
    setInput("");
    setIsResponding(true);

    const context = isAuthenticated
      ? await refreshAssistantContext(false)
      : null;
    const reply = buildAssistantReply({
      input: trimmed,
      pathname,
      isAuthenticated,
      context,
    });
    const assistantMessage: ChatMessage = {
      id: `assistant-${messageIdRef.current++}`,
      role: "assistant",
      text: reply.text,
      links: reply.links,
      meta: reply.meta,
    };

    setMessages((current) => [...current, assistantMessage].slice(-18));
    setIsResponding(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion(input);
  }

  if (!hydrated) return null;

  const commonPointerHandlers = {
    onPointerDown: beginDrag,
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };

  const contextDescription = assistantContext
    ? `${assistantContext.nextAction.title}: ${assistantContext.nextAction.detail}`
    : routeContext.description;

  return (
    <div
      ref={containerRef}
      className="fixed z-[1800] select-none"
      style={{
        left: position?.x ?? 0,
        top: position?.y ?? 0,
        visibility: position ? "visible" : "hidden",
      }}
    >
      {collapsed ? (
        <button
          type="button"
          data-button-variant="primary"
          aria-label="Abrir Asistente LEDGERA. Puedes arrastrar este botón para moverlo."
          title="Abrir Asistente LEDGERA"
          className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-4 py-3 text-sm font-black shadow-[0_18px_50px_rgba(2,8,23,0.45)] backdrop-blur-xl transition hover:-translate-y-0.5 focus-visible:outline-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ touchAction: "none" }}
          onClick={() => {
            if (ignoreNextClickRef.current) return;
            setCollapsedState(false);
          }}
          onKeyDown={moveWithKeyboard}
          {...commonPointerHandlers}
        >
          <AssistantIcon />
          Asistente LEDGERA
        </button>
      ) : (
        <section
          role="complementary"
          aria-label="Asistente y soporte de LEDGERA"
          className="w-[390px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[28px] border border-accent bg-bg-elev/95 shadow-[0_24px_80px_rgba(2,8,23,0.55)] backdrop-blur-xl"
        >
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <button
              type="button"
              data-button-variant="secondary"
              aria-label="Mover panel del asistente"
              title="Arrastrar panel"
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-text-faint ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
              style={{ touchAction: "none" }}
              onKeyDown={moveWithKeyboard}
              {...commonPointerHandlers}
            >
              <GripIcon />
            </button>

            <div className="min-w-0 flex-1">
              <p className="m-0 text-xs font-black uppercase tracking-[0.16em] text-accent">
                Asistente LEDGERA
              </p>
              <p className="m-0 mt-1 flex items-center gap-2 text-[11px] font-semibold text-text-faint">
                <span className={`h-2 w-2 rounded-full ${contextStatus === "unavailable" ? "bg-warn" : "bg-gain"}`} aria-hidden="true" />
                {statusLabel(contextStatus, isAuthenticated)}
              </p>
            </div>

            <button
              type="button"
              data-button-variant="secondary"
              aria-label="Ocultar Asistente LEDGERA"
              title="Ocultar"
              onClick={() => setCollapsedState(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
            >
              <CloseIcon />
            </button>
          </header>

          <div className="grid grid-cols-2 gap-2 border-b border-border p-3">
            <button
              type="button"
              data-button-variant={activeView === "assistant" ? "primary" : "secondary"}
              aria-pressed={activeView === "assistant"}
              onClick={() => setView("assistant")}
              className="min-h-10 rounded-xl border px-3 text-xs font-black"
            >
              Asistente
            </button>
            <button
              type="button"
              data-button-variant={activeView === "feedback" ? "primary" : "secondary"}
              aria-pressed={activeView === "feedback"}
              onClick={() => setView("feedback")}
              className="min-h-10 rounded-xl border px-3 text-xs font-black"
            >
              Enviar opinión
            </button>
          </div>

          {activeView === "assistant" ? (
            <div className="select-text">
              <div className="border-b border-border bg-bg-sunken/60 px-4 py-3">
                <p className="m-0 text-[10px] font-black uppercase tracking-[0.14em] text-accent">
                  {assistantContext ? "Prioridad detectada" : `Sección actual · ${routeContext.label}`}
                </p>
                <p className="m-0 mt-1 text-xs leading-5 text-text-soft">
                  {contextDescription}
                </p>
              </div>

              <div
                ref={messageListRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-busy={isResponding}
                className="grid max-h-[330px] min-h-[260px] gap-3 overflow-y-auto px-4 py-4"
              >
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`max-w-[88%] rounded-2xl border px-3.5 py-3 text-[12.5px] leading-5 ${
                      message.role === "user"
                        ? "ml-auto border-accent bg-accent-soft text-text"
                        : "mr-auto border-border bg-bg-sunken text-text-soft"
                    }`}
                  >
                    <p className="m-0 whitespace-pre-wrap">{message.text}</p>
                    {message.meta && (
                      <p className="m-0 mt-2 border-t border-border pt-2 text-[10px] font-semibold text-text-faint">
                        {message.meta}
                      </p>
                    )}
                    {message.links && message.links.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.links.map((link) => (
                          <Link
                            key={`${message.id}-${link.href}-${link.label}`}
                            href={link.href}
                            data-button-variant="secondary"
                            className="inline-flex min-h-9 items-center rounded-xl border px-3 text-[11px] font-black"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </article>
                ))}

                {isResponding && (
                  <article className="mr-auto max-w-[88%] rounded-2xl border border-border bg-bg-sunken px-3.5 py-3 text-[12.5px] leading-5 text-text-faint">
                    Analizando la consulta y el estado de tu cuenta…
                  </article>
                )}
              </div>

              <div className="border-t border-border px-4 py-3">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <label htmlFor="ledgera-assistant-input" className="sr-only">
                    Pregunta para el Asistente LEDGERA
                  </label>
                  <input
                    id="ledgera-assistant-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    maxLength={500}
                    autoComplete="off"
                    placeholder="Escribe tu pregunta"
                    disabled={isResponding}
                    className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-bg-sunken px-3 text-sm text-text outline-none placeholder:text-text-faint focus:border-accent disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    data-button-variant="primary"
                    disabled={!input.trim() || isResponding}
                    aria-label="Enviar pregunta"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border"
                  >
                    <SendIcon />
                  </button>
                </form>
                <p className="m-0 mt-2 text-[10px] leading-4 text-text-faint">
                  Usa datos generales de avance. No compartas contraseñas, códigos 2FA, claves privadas ni secretos de API.
                </p>
              </div>
            </div>
          ) : (
            <div className="select-text p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-accent bg-accent-soft text-accent">
                <FeedbackIcon />
              </div>
              <h2 className="m-0 mt-4 text-lg font-black text-text">Ayúdanos a mejorar LEDGERA</h2>
              <p className="m-0 mt-2 text-sm leading-6 text-text-soft">
                Cuéntanos qué falta, qué no se entiende o qué deberíamos corregir. La opinión de producto se mantiene separada de las consultas del asistente.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Link
                  href="/opinion"
                  data-button-variant="primary"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-black"
                >
                  Enviar opinión
                </Link>
                <Link
                  href="/contacto"
                  data-button-variant="secondary"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-black"
                >
                  Contactar soporte
                </Link>
              </div>
              <p className="m-0 mt-4 text-[10px] leading-4 text-text-faint">
                No incluyas credenciales, códigos de autenticación ni secretos de integración.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function AssistantIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 9h8M8 13h5" />
      <path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7l-4.5 3V18H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M17.5 2.5v3M16 4h3" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
      <circle cx="6" cy="5" r="1.35" />
      <circle cx="14" cy="5" r="1.35" />
      <circle cx="6" cy="10" r="1.35" />
      <circle cx="14" cy="10" r="1.35" />
      <circle cx="6" cy="15" r="1.35" />
      <circle cx="14" cy="15" r="1.35" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 10 13-6-4 12-2.4-4.2L3 10Z" />
      <path d="m9.6 11.8 3.2-3.2" />
    </svg>
  );
}

function FeedbackIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v11H9l-5 4V5Z" />
      <path d="M8 9h8M8 12h5" />
    </svg>
  );
}
