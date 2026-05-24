import type { BinanceConnectionStatus } from "../domain/BinanceConnection";
import {
  validateApiKey,
  validateReadonlyPermissions,
} from "../infrastructure/binanceClient";

type ConnectInput = {
  userId:    string;
  apiKey:    string;
  apiSecret: string;
};

type ConnectSuccess = {
  ok:         true;
  status:     "CONNECTED";
  message:    string;
  connection: {
    provider:    "BINANCE";
    permissions: string[];
  };
};

type ConnectFailure = {
  ok:      false;
  status:  BinanceConnectionStatus;
  message: string;
};

export type ConnectBinanceResult = ConnectSuccess | ConnectFailure;

export async function connectBinanceAccount(
  input: ConnectInput,
): Promise<ConnectBinanceResult> {
  const { apiKey, apiSecret } = input;

  if (!apiKey || !apiSecret) {
    return {
      ok:      false,
      status:  "DISCONNECTED",
      message: "Faltan credenciales obligatorias para conectar Binance.",
    };
  }

  const validation = await validateApiKey(apiKey, apiSecret);

  if (!validation.valid) {
    const isInvalidKey = validation.binanceCode === -2008 || validation.binanceCode === -2014;
    return {
      ok:      false,
      status:  isInvalidKey ? "INVALID_CREDENTIALS" : "ERROR",
      message: validation.error ?? "Las credenciales no son válidas en Binance.",
    };
  }

  const perms = await validateReadonlyPermissions(apiKey, apiSecret);

  if (perms.error) {
    return {
      ok:      false,
      status:  "ERROR",
      message: perms.error,
    };
  }

  if (!perms.readonly) {
    return {
      ok:      false,
      status:  "READONLY_REQUIRED",
      message:
        "La API key tiene permisos de trading o retiro activos. " +
        "Por seguridad, Ledgera solo acepta keys de solo lectura.",
    };
  }

  return {
    ok:      true,
    status:  "CONNECTED",
    message: "Credenciales válidas. Conexión lista para activarse.",
    connection: {
      provider:    "BINANCE",
      permissions: perms.permissions,
    },
  };
}
