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

type Position = {
  x: number;
  y: number;
};

type WidgetView = "assistant" | "feedback";

type StoredWidgetState = {
  collapsed: boolean;
  position: Position | null;
  activeView: WidgetView;
};

type AssistantLink = {
  label: string;
  href: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  links?: AssistantLink[];
};

type RouteContext = {
  label: string;
  description: string;
};

const STORAGE_KEY = "ledgera-support-widget-v1";
const VIEWPORT_MARGIN = 12;
const DRAG_THRESHOLD = 4;

const QUICK_PROMPTS = [
  "¿Cómo importo operaciones?",
  "¿Dónde reviso pendientes?",
  "¿Cómo veo mi estado tributario?",
  "¿Cómo genero un respaldo?",
];

const PROTECTED_LINKS = new Set([
  "/importaciones",
  "/cryptoactivos",
  "/obligaciones-tributarias",
  "/declaraciones",
  "/configuracion/seguridad",
  "/configuracion/facturacion",
  "/panel",
]);

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

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function getRouteContext(pathname: string): RouteContext {
  if (pathname.startsWith("/importaciones") || pathname.startsWith("/import/")) {
    return {
      label: "Importaciones",
      description: "Aquí incorporas y confirmas movimientos provenientes de exchanges o archivos.",
    };
  }

  if (pathname.startsWith("/cryptoactivos")) {
    return {
      label: "Activos",
      description: "Aquí revisas los activos detectados y la trazabilidad de sus operaciones.",
    };
  }

  if (pathname.startsWith("/obligaciones-tributarias")) {
    return {
      label: "Obligaciones tributarias",
      description: "Aquí LEDGERA muestra el resultado preliminar y los registros que requieren revisión.",
    };
  }

  if (pathname.startsWith("/declaraciones")) {
    return {
      label: "Declaraciones",
      description: "Aquí generas los respaldos PDF y Excel a partir de información confirmada.",
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
      description: "Aquí tienes una vista resumida del avance y estado general de tu información.",
    };
  }

  return {
    label: "LEDGERA",
    description: "Puedo orientarte por la plataforma y llevarte al módulo correcto.",
  };
}

function resolveHref(href: string, isAuthenticated: boolean): string {
  if (isAuthenticated || !PROTECTED_LINKS.has(href)) return href;
  return "/login";
}

function buildReply(input: string, pathname: string, isAuthenticated: boolean): Omit<ChatMessage, "id" | "role"> {
  const value = normalize(input);
  const protectedLink = (label: string, href: string): AssistantLink => ({
    label: isAuthenticated ? label : "Iniciar sesión",
    href: resolveHref(href, isAuthenticated),
  });

  if (!value) {
    return {
      text: "Escribe una pregunta sobre el uso de LEDGERA o selecciona una de las opciones rápidas.",
    };
  }

  if (includesAny(value, ["hola", "buenas", "ayuda", "que puedes hacer", "como funciona el asistente"])) {
    return {
      text: "Puedo explicarte cómo importar operaciones, revisar pendientes, entender los estados de la plataforma, generar respaldos y encontrar configuraciones. No reemplazo una revisión tributaria profesional ni concluyo impuestos dentro del chat.",
      links: [
        protectedLink("Ir al panel", "/panel"),
        { label: "Ver preguntas frecuentes", href: "/preguntas" },
      ],
    };
  }

  if (includesAny(value, ["importar", "importacion", "binance", "exchange", "csv", "archivo", "operaciones"])) {
    return {
      text: "Para incorporar operaciones, entra en Importaciones, selecciona el origen y carga el archivo o integración disponible. Después confirma los registros correctos y deja en revisión los que necesiten antecedentes.",
      links: [
        protectedLink("Abrir Importaciones", "/importaciones"),
        protectedLink("Revisar Binance", "/import/binance"),
      ],
    };
  }

  if (includesAny(value, ["pendiente", "pendientes", "revisar", "revision", "inconsistencia", "error de operacion", "confirmar movimiento"])) {
    return {
      text: "Los registros pendientes se resuelven en Importaciones. Revisa fecha, activo, cantidad, tipo de operación y fuente antes de confirmar. Mientras existan pendientes, el resultado tributario puede cambiar.",
      links: [protectedLink("Revisar operaciones", "/importaciones")],
    };
  }

  if (includesAny(value, ["activo", "activos", "criptoactivo", "portafolio", "saldo", "trazabilidad"])) {
    return {
      text: "La sección Activos consolida los criptoactivos detectados y permite revisar qué operaciones respaldan cada resultado. No debe interpretarse como un saldo de exchange en tiempo real.",
      links: [protectedLink("Abrir Activos", "/cryptoactivos")],
    };
  }

  if (includesAny(value, ["estado tributario", "obligacion tributaria", "semaforo", "accion requerida", "sin impuestos", "impuesto por pagar", "debo pagar", "cuanto impuesto"])) {
    return {
      text: "El estado tributario de LEDGERA es preliminar y depende de que la información esté completa. Verde indica que no se detectaron eventos con impacto en los datos incorporados; amarillo exige revisión; rojo indica operaciones que requieren acción. El chat no determina tu impuesto final.",
      links: [
        protectedLink("Ver estado tributario", "/obligaciones-tributarias"),
        { label: "Solicitar revisión", href: "/contacto" },
      ],
    };
  }

  if (includesAny(value, ["declaracion", "declaraciones", "pdf", "excel", "respaldo", "f22", "extracto"])) {
    return {
      text: "Los respaldos se generan en Declaraciones una vez que las operaciones relevantes están confirmadas. El PDF sirve como documento de lectura y el Excel como soporte estructurado de trazabilidad.",
      links: [protectedLink("Generar respaldo", "/declaraciones")],
    };
  }

  if (includesAny(value, ["dolar", "usd", "tipo de cambio", "banco central", "cotizacion"])) {
    return {
      text: "LEDGERA utiliza el dólar observado oficial del Banco Central para la fecha correspondiente. La fuente y fecha deben mostrarse junto al valor; una cotización atrasada no debe presentarse como vigente.",
      links: [protectedLink("Volver al panel", "/panel")],
    };
  }

  if (includesAny(value, ["2fa", "segundo factor", "autenticador", "seguridad", "codigo no funciona", "recuperar acceso"])) {
    return {
      text: "La configuración del segundo factor está en Seguridad. Nunca compartas códigos 2FA, contraseñas, claves privadas ni secretos de API dentro del chat o en formularios de soporte.",
      links: [
        protectedLink("Abrir Seguridad", "/configuracion/seguridad"),
        { label: "Recuperar 2FA", href: "/recuperar-2fa" },
      ],
    };
  }

  if (includesAny(value, ["contrasena", "password", "olvide mi clave", "restablecer clave"])) {
    return {
      text: isAuthenticated
        ? "Puedes administrar la seguridad de tu cuenta desde Configuración. Para una contraseña olvidada, utiliza el flujo de recuperación y evita enviar credenciales por soporte."
        : "Utiliza el flujo de recuperación de contraseña. LEDGERA nunca debe solicitarte la contraseña actual por correo o chat.",
      links: [
        isAuthenticated
          ? protectedLink("Abrir Seguridad", "/configuracion/seguridad")
          : { label: "Recuperar contraseña", href: "/forgot-password" },
      ],
    };
  }

  if (includesAny(value, ["plan", "planes", "suscripcion", "pago", "facturacion", "precio", "cobro"])) {
    return {
      text: "Puedes comparar los planes disponibles y administrar la facturación desde las secciones correspondientes. Una acción de cobro o cancelación siempre debe requerir confirmación explícita.",
      links: [
        { label: "Ver planes", href: "/planes" },
        protectedLink("Administrar facturación", "/configuracion/facturacion"),
      ],
    };
  }

  if (includesAny(value, ["opinion", "feedback", "sugerencia", "problema", "contactar", "soporte", "hablar con alguien"])) {
    return {
      text: "Puedes enviar una opinión sobre la plataforma o contactar soporte. No incluyas contraseñas, códigos 2FA, claves privadas ni secretos de integración.",
      links: [
        { label: "Enviar opinión", href: "/opinion" },
        { label: "Contactar soporte", href: "/contacto" },
      ],
    };
  }

  if (includesAny(value, ["ganancia", "perdida", "renta", "tributa", "sii", "domicilio", "residencia", "declarar en chile"])) {
    return {
      text: "Esa consulta puede depender de antecedentes personales, residencia, tipo de operación, base de costo y período tributario. Para evitar una conclusión incorrecta, revisa primero el análisis de LEDGERA y solicita evaluación profesional cuando corresponda.",
      links: [
        protectedLink("Abrir análisis tributario", "/obligaciones-tributarias"),
        { label: "Contactar soporte", href: "/contacto" },
      ],
    };
  }

  const context = getRouteContext(pathname);
  return {
    text: `No tengo una respuesta cerrada para esa consulta en esta primera versión. Estás en ${context.label}. Puedo orientarte sobre importaciones, activos, pendientes, estado tributario, respaldos, seguridad o facturación.`,
    links: [
      { label: "Contactar soporte", href: "/contacto" },
      { label: "Ver preguntas frecuentes", href: "/preguntas" },
    ],
  };
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Soy el Asistente LEDGERA. Puedo ayudarte a encontrar funciones y entender el flujo de la plataforma. No reemplazo una revisión tributaria profesional.",
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
  }, [messages]);

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

  function submitQuestion(question: string) {
    const trimmed = question.trim().slice(0, 500);
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `user-${messageIdRef.current++}`,
      role: "user",
      text: trimmed,
    };
    const reply = buildReply(trimmed, pathname, isAuthenticated);
    const assistantMessage: ChatMessage = {
      id: `assistant-${messageIdRef.current++}`,
      role: "assistant",
      ...reply,
    };

    setMessages((current) => [...current, userMessage, assistantMessage].slice(-18));
    setInput("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuestion(input);
  }

  if (!hydrated) return null;

  const commonPointerHandlers = {
    onPointerDown: beginDrag,
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };

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
                <span className="h-2 w-2 rounded-full bg-gain" aria-hidden="true" />
                Orientación de plataforma
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
                  Sección actual · {routeContext.label}
                </p>
                <p className="m-0 mt-1 text-xs leading-5 text-text-soft">
                  {routeContext.description}
                </p>
              </div>

              <div
                ref={messageListRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions"
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
              </div>

              <div className="border-t border-border px-4 py-3">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      data-button-variant="secondary"
                      onClick={() => submitQuestion(prompt)}
                      className="min-h-9 shrink-0 rounded-xl border px-3 text-[11px] font-black"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

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
                    placeholder="Pregunta sobre LEDGERA"
                    className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-bg-sunken px-3 text-sm text-text outline-none placeholder:text-text-faint focus:border-accent"
                  />
                  <button
                    type="submit"
                    data-button-variant="primary"
                    disabled={!input.trim()}
                    aria-label="Enviar pregunta"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border"
                  >
                    <SendIcon />
                  </button>
                </form>
                <p className="m-0 mt-2 text-[10px] leading-4 text-text-faint">
                  No compartas contraseñas, códigos 2FA, claves privadas ni secretos de API.
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
