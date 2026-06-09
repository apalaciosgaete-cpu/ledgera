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
      display: none;
    }
    .ledgera-auth-trust-title {
      color: #0f2a3d;
      font-size: 12px;
      font-weight: 800;
      margin: 0;
    }
    .ledgera-auth-trust-item {
      align-items: flex-start;
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
    .ledgera-google-entry-button:hover {
      background: #f8fafc;
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
      display: none;
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

function googleLogo() {
  return `
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M17.64 9.204c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.91c1.702-1.567 2.682-3.874 2.682-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.91-2.259c-.806.54-1.837.86-3.046.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.043l3.007-2.333z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  `;
}

function buildLoginBlock() {
  const wrapper = document.createElement("div");
  wrapper.id = LOGIN_BLOCK_ID;
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "12px";

  wrapper.innerHTML = `
    <a class="ledgera-google-entry-button" href="/api/auth/google">
      ${googleLogo()}
      Continuar con Google
    </a>

    <div class="ledgera-auth-separator">o ingresa con correo</div>

    <div class="ledgera-auth-trust-box">
      <p class="ledgera-auth-trust-title">Seguridad de acceso</p>
      <p class="ledgera-auth-trust-item"><span class="ledgera-auth-trust-check">✓</span> Inicio seguro con Google disponible</p>
      <p class="ledgera-auth-trust-item"><span class="ledgera-auth-trust-check">✓</span> 2FA configurable desde Seguridad después de ingresar</p>
      <p class="ledgera-auth-trust-item"><span class="ledgera-auth-trust-check">✓</span> Sesión protegida para tu información financiera</p>
    </div>
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
      ${googleLogo()}
      Crear o ingresar con Google
    </a>

    <div class="ledgera-register-trust-box">
      <p class="ledgera-register-trust-title">Protección de cuenta</p>
      <p class="ledgera-register-trust-item"><span class="ledgera-auth-trust-check">✓</span> Inicio seguro con Google disponible</p>
      <p class="ledgera-register-trust-item"><span class="ledgera-auth-trust-check">✓</span> 2FA configurable después de crear tu cuenta</p>
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
      if (pathname === "/login") injectLoginTrust();
      if (pathname === "/register") injectRegisterTrust();
    };

    run();
    const t1 = window.setTimeout(run, 150);
    const t2 = window.setTimeout(run, 400);
    const t3 = window.setTimeout(run, 800);

    const observer = new MutationObserver(() => {
      if (!document.getElementById(LOGIN_BLOCK_ID) && !document.getElementById(REGISTER_BLOCK_ID)) {
        run();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
