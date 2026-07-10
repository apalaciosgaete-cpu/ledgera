"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { fonts } from "@/styles/tokens";
import { findWalletById } from "@/modules/crypto/catalogs/sourceFundsCatalogs";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";

type ApiResponse<T> = { ok: boolean; message: string; data: T };

type WalletConnection = {
  id: string;
  network: "BITCOIN" | "ETHEREUM" | "SOLANA";
  address: string;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  updatedAt: string;
  explorerUrl: string;
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--bg-elev)",
  color: "var(--text)",
  padding: "0 12px",
  fontFamily: fonts.body,
  boxSizing: "border-box",
};

function shortAddress(address: string): string {
  if (address.length <= 20) return address;
  return `${address.slice(0, 10)}…${address.slice(-8)}`;
}

export default function WalletDetailPage() {
  const router = useRouter();
  const params = useParams<{ walletId: string }>();
  const wallet = findWalletById(params.walletId);

  const [network, setNetwork] = useState<WalletConnection["network"]>("BITCOIN");
  const [address, setAddress] = useState("");
  const [connections, setConnections] = useState<WalletConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  if (!wallet) notFound();
  const resolvedWallet = wallet;

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpClient<ApiResponse<WalletConnection[]>>("/api/wallet-connections", { auth: true });
      setConnections(response.data);
    } catch {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  const walletConnections = useMemo(
    () => connections.filter((connection) => connection.label === resolvedWallet.name || connection.label === resolvedWallet.shortName),
    [connections, resolvedWallet.name, resolvedWallet.shortName],
  );

  async function connectAddress(event: FormEvent) {
    event.preventDefault();
    if (!address.trim()) return;

    setSaving(true);
    setFeedback(null);
    try {
      const response = await httpClient<ApiResponse<WalletConnection>>("/api/wallet-connections", {
        auth: true,
        method: "POST",
        body: {
          network,
          address: address.trim(),
          label: resolvedWallet.name,
        },
      });
      setAddress("");
      setFeedback({ ok: true, message: response.message });
      await loadConnections();
    } catch (error) {
      setFeedback({ ok: false, message: isHttpClientError(error) ? error.message : "No fue posible conectar la dirección pública." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ minHeight: "calc(100vh - 100px)", display: "grid", gap: 16, alignContent: "start", paddingBottom: 72 }}>
      <section>
        <button onClick={() => router.push("/origen-fondos/wallets")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-soft)", fontSize: 13, fontFamily: fonts.body, padding: 0, marginBottom: 8 }}>← Volver a Wallets</button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={resolvedWallet.logoUrl} alt={resolvedWallet.name} style={{ width: 58, height: 42, objectFit: "contain" }} />
          <div>
            <h1 style={{ color: "var(--text)", fontSize: "clamp(1.35rem,2.4vw,1.72rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.04em", fontFamily: fonts.display }}>{resolvedWallet.name}</h1>
            <p style={{ margin: "4px 0 0", color: "var(--text-soft)", fontSize: 13.5, fontFamily: fonts.body }}>Wallet fría · conexión pública de solo lectura</p>
          </div>
        </div>
      </section>

      <section style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)", padding: 18, boxShadow: "0 10px 24px rgba(15,42,61,0.05)", fontFamily: fonts.body }}>
        <strong style={{ display: "block", color: "var(--text)", fontSize: 16, fontWeight: 900 }}>Conectar una dirección pública</strong>
        <p style={{ margin: "5px 0 14px", color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.45 }}>Selecciona la red e ingresa una dirección pública. LEDGERA no solicita frase semilla, PIN, llave privada ni acceso físico al dispositivo.</p>

        <form onSubmit={connectAddress} style={{ display: "grid", gridTemplateColumns: "minmax(170px,0.45fr) minmax(260px,1fr) auto", gap: 10, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 5, color: "var(--text-soft)", fontSize: 11.5 }}>
            Red
            <select value={network} onChange={(event) => setNetwork(event.target.value as WalletConnection["network"])} style={fieldStyle}>
              <option value="BITCOIN">Bitcoin</option>
              <option value="ETHEREUM">Ethereum</option>
              <option value="SOLANA">Solana</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 5, color: "var(--text-soft)", fontSize: 11.5 }}>
            Dirección pública
            <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder={network === "ETHEREUM" ? "0x…" : network === "BITCOIN" ? "bc1… / 1… / 3…" : "Dirección Solana"} autoComplete="off" spellCheck={false} style={{ ...fieldStyle, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }} />
          </label>
          <button type="submit" disabled={saving || !address.trim()} style={{ minHeight: 44, borderRadius: 12, border: "none", background: "var(--accent)", color: "var(--text)", padding: "0 16px", fontWeight: 900, cursor: saving ? "wait" : "pointer", opacity: !address.trim() ? 0.5 : 1 }}>
            {saving ? "Conectando…" : "Conectar dirección"}
          </button>
        </form>

        {feedback && (
          <div style={{ marginTop: 12, borderRadius: 12, padding: "10px 12px", border: `1px solid ${feedback.ok ? "rgba(22,163,74,0.24)" : "rgba(239,68,68,0.24)"}`, background: feedback.ok ? "rgba(22,163,74,0.08)" : "rgba(239,68,68,0.08)", color: feedback.ok ? "var(--accent)" : "var(--loss)", fontSize: 12.5 }}>
            {feedback.message}
          </div>
        )}
      </section>

      <section style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)", padding: 18, fontFamily: fonts.body }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div>
            <strong style={{ display: "block", color: "var(--text)", fontSize: 15.5, fontWeight: 900 }}>Direcciones conectadas</strong>
            <span style={{ color: "var(--text-soft)", fontSize: 11.5 }}>Solo se almacena información pública.</span>
          </div>
          <span style={{ borderRadius: 999, padding: "4px 9px", background: "var(--bg-sunken)", color: "var(--text-soft)", fontSize: 11, fontWeight: 900 }}>{walletConnections.length}</span>
        </div>

        {loading ? (
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12.5 }}>Cargando conexiones…</p>
        ) : walletConnections.length === 0 ? (
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12.5 }}>Aún no hay direcciones asociadas a {resolvedWallet.name}.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {walletConnections.map((connection) => (
              <div key={connection.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <strong style={{ display: "block", color: "var(--text)", fontSize: 12.5 }}>{connection.network}</strong>
                  <span title={connection.address} style={{ color: "var(--text-soft)", fontSize: 11.5, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{shortAddress(connection.address)}</span>
                </div>
                <a href={connection.explorerUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", minHeight: 34, display: "inline-flex", alignItems: "center", borderRadius: 9, border: "1px solid var(--border)", color: "var(--text)", padding: "0 11px", fontSize: 11.5, fontWeight: 900 }}>
                  Ver en explorador ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
