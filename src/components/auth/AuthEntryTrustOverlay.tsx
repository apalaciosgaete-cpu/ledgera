"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STYLE_ID = "ledgera-auth-entry-trust-style";
const LOGIN_BLOCK_ID = "ledgera-login-trust-block";
const REGISTER_BLOCK_ID = "ledgera-register-trust-block";

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .ledgera-auth-trust-box {
      border-radius: 10px;
      border: 1px solid rgba(22, 163, 74, 0.28);
      background: rgba(22, 163, 74, 0.08);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 7px;
      font-family: inherit;
    }
    .ledgera-auth-trust-title {
      color: #0f2a3d;
      font-size: 12px;
      font-weight: 800;
      margin: 0;
    }
    .ledgera-auth-trust-item {
      align-items: center;
      color: #0f2a3d;
      display: flex;
      font-size: 12px;
      font-weight: 700;
      gap: 8px;
      line-height: 1.35;
      margin: 0;
    }
    .ledgera-auth-trust-check {
      color: #16a34a;
      font-weight: 900;
    }
    .ledgera-google-entry-button {
      align-items: center;
      background: #ffffff;
      border: 1px solid rgba(15, 42, 61, 0.18);
      border-radius: 8px;
      color: #0f2a3d;
      display: flex;
      font-family: inherit;
      font-size: 14px;
      font-weight: 800;
      gap: 10px;
      justify-content: center;
      padding: 12px;
      text-decoration: none;
      width: 100%;
      box-sizing: border-box;
    }
    .ledgera-auth-separator {
      align-items: center;
      display: flex;
      gap: 10px;
      color: #64748b;
      font-size: 12px;
      font-weight: 800;
    }
    .ledgera-auth-separator::before,
    .ledgera-auth-separator::after {
      content: "";
      height: 1px;
      flex: 1;
      background: rgba(15, 42, 61, 0.16);
    }
    .ledgera-register-trust-box {
      border-radius: 10px;
      border: 1px solid rgba(22, 163, 74, 0.30);
      background: rgba(22, 163, 74, 0.08);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-family: inherit;
    }
    .ledgera-register-trust-title {
      color: #4ade80;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.06em;
      margin: 0;
      text-transform: uppercase;
    }
    .ledgera-register-trust-item {
      align-items: flex-start;
      color: #cbd5e1;
      display: flex;
      font-size: 12px;
      gap: 8px;
      line-height: 1.4;
      margin: 0;
    }
  `;
  document.head.appendChild(style);
}

function googleMark() {
  return `<span aria-hidden="true" style="align-items:center;border-radius:50%;border:1px solid #dbe3ef;color:#0f2a3d;display:inline-flex;font-weight:900;height:20px;justify-content:center;width:20px;">G</span>`;
}

function buildLoginBlock() {
  const wrapper = document.createElement("div");
  wrapper.id = LOGIN_BLOCK_ID;
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "12px";

  wrapper.innerHTML = `
    <div class="ledgera-auth-trust-box">
      <p class="ledgera-auth-trust-title">Acceso protegido</p>
      <p class="ledgera-auth-trust-item"><span class="ledgera-auth-trust-check">✓</span> Compatible con autenticación en dos factores (2FA)</p>
      <p class="ledgera-auth-trust-item"><span class="ledgera-auth-trust-check">✓</span> Puedes ingresar con Google o con correo y contraseña</p>
    </div>
    <a class="ledgera-google-entry-button" href="/api/auth/google">
      ${googleMark()}
      Continuar con Google
    </a>
    <div class="ledgera-auth-separator">o ingresa con correo</div>
  `;

  return wrapper;
}

function buildRegisterBlock() {
  const wrapper = document.createElement("div");
  wrapper.id = REGISTER_BLOCK_ID;
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "12px";

  wrapper.innerHTML = `
    <a class="ledgera-google-entry-button" href="/api/auth/google">
      ${googleMark()}
      Crear o ingresar con Google
    </a>
    <div class="ledgera-register-trust-box">
      <p class="ledgera-register-trust-title">Protección de cuenta</p>
      <p class="ledgera-register-trust-item"><span class="ledgera-auth-trust-check">✓</span> Autenticación en dos factores con app autenticadora</p>
      <p class="ledgera-register-trust-item"><span class="ledgera-auth-trust-check">✓</span> Inicio seguro con Google disponible</p>
      <p class="ledgera-register-trust-item"><span class="ledgera-auth-trust-check">✓</span> Credenciales protegidas y sesión segura</p>
    </div>
  `;

  return wrapper;
}

function removeInjectedBlocks() {
  document.getElementById(LOGIN_BLOCK_ID)?.remove();
  document.getElementById(REGISTER_BLOCK_ID)?.remove();
}

function injectLoginTrust() {
  if (document.getElementById(LOGIN_BLOCK_ID)) return;

  const title = Array.from(document.querySelectorAll("h1")).find((node) =>
    node.textContent?.trim().toLowerCase().includes("iniciar sesión"),
  );

  const card = title?.closest("div")?.parentElement;
  if (!card) return;

  const firstForm = card.querySelector("form");
  if (!firstForm) return;

  firstForm.before(buildLoginBlock());
}

function injectRegisterTrust() {
  if (document.getElementById(REGISTER_BLOCK_ID)) return;

  const form = document.querySelector("form");
  if (!form) return;

  const firstField = form.firstElementChild;
  if (!firstField) return;

  firstField.before(buildRegisterBlock());
}

export default function AuthEntryTrustOverlay() {
  const pathname = usePathname();

  useEffect(() => {
    ensureStyles();
    removeInjectedBlocks();

    const run = () => {
      if (pathname === "/login") {
        injectLoginTrust();
      }

      if (pathname === "/register") {
        injectRegisterTrust();
      }
    };

    run();
    const timeout = window.setTimeout(run, 150);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  return null;
}
