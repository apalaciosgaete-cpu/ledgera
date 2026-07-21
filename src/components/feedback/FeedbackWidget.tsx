"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONSENT_EVENT,
  readConsentSnapshot,
  type ConsentSnapshot,
} from "@/lib/privacy/consent";

type Position = {
  x: number;
  y: number;
};

type StoredWidgetState = {
  collapsed: boolean;
  position: Position | null;
};

const STORAGE_KEY = "ledgera-feedback-widget-v1";
const VIEWPORT_MARGIN = 12;
const DRAG_THRESHOLD = 4;

function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Position>;
  return Number.isFinite(candidate.x) && Number.isFinite(candidate.y);
}

function readStoredWidgetState(): StoredWidgetState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredWidgetState>;
    return {
      collapsed: parsed.collapsed === true,
      position: isPosition(parsed.position) ? parsed.position : null,
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

export default function FeedbackWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<Position | null>(null);
  const collapsedRef = useRef(false);
  const canPersistRef = useRef(false);
  const ignoreNextClickRef = useRef(false);
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
  const [position, setPosition] = useState<Position | null>(null);
  const [dragging, setDragging] = useState(false);

  const persistCurrentState = useCallback(() => {
    if (!canPersistRef.current) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          collapsed: collapsedRef.current,
          position: positionRef.current,
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
        setCollapsed(stored.collapsed);
        setPosition(stored.position);
      }
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
  }, [collapsed, hydrated, persistCurrentState, placeWithinViewport]);

  useEffect(() => {
    if (!hydrated) return;

    function handleResize() {
      placeWithinViewport(positionRef.current);
      persistCurrentState();
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hydrated, persistCurrentState, placeWithinViewport]);

  function setCollapsedState(nextCollapsed: boolean) {
    collapsedRef.current = nextCollapsed;
    setCollapsed(nextCollapsed);
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
    const direction = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }[event.key];

    if (!direction) return;
    event.preventDefault();

    const rect = node.getBoundingClientRect();
    const next = clampPosition(
      {
        x: current.x + direction[0],
        y: current.y + direction[1],
      },
      rect.width,
      rect.height,
    );

    positionRef.current = next;
    setPosition(next);
    persistCurrentState();
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
          aria-label="Abrir feedback. Puedes arrastrar este botón para moverlo."
          title="Abrir feedback"
          className={`inline-flex min-h-12 items-center gap-2 rounded-full border border-accent bg-bg-elev/95 px-4 py-3 text-sm font-black text-accent shadow-[0_18px_50px_rgba(2,8,23,0.45)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ touchAction: "none" }}
          onClick={() => {
            if (ignoreNextClickRef.current) return;
            setCollapsedState(false);
          }}
          onKeyDown={moveWithKeyboard}
          {...commonPointerHandlers}
        >
          <MessageIcon />
          Feedback
        </button>
      ) : (
        <section
          role="complementary"
          aria-label="Feedback sobre LEDGERA"
          className="w-[320px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[28px] border border-accent bg-bg-elev/95 shadow-[0_24px_80px_rgba(2,8,23,0.55)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <button
              type="button"
              aria-label="Mover panel de feedback"
              title="Arrastrar panel"
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-bg-sunken text-text-faint transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
              style={{ touchAction: "none" }}
              onKeyDown={moveWithKeyboard}
              {...commonPointerHandlers}
            >
              <GripIcon />
            </button>

            <p className="min-w-0 flex-1 text-xs font-black uppercase tracking-[0.18em] text-accent">
              ¿Nos das feedback?
            </p>

            <button
              type="button"
              aria-label="Ocultar panel de feedback"
              title="Ocultar"
              onClick={() => setCollapsedState(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-transparent text-text-faint transition hover:border-border hover:bg-bg-sunken hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="p-6 pt-5">
            <p className="select-text text-sm font-medium leading-7 text-text-soft">
              Cuéntanos qué falta, qué no se entiende o qué deberíamos mejorar para que LEDGERA sea más útil al revisar tus operaciones cripto.
            </p>

            <Link
              href="/contacto"
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-black text-accent-contrast transition hover:-translate-y-0.5 hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-elev"
            >
              Contactar
            </Link>
          </div>
        </section>
      )}
    </div>
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
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <path d="M4 4.75h12v8.5H9.25L6 16v-2.75H4z" />
    </svg>
  );
}
