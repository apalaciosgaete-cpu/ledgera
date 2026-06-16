import { encryptSecret } from "@/modules/security/application/encryption";
import { upsertBinanceConnection } from "@/modules/integrations/binance/infrastructure/connectionRepository";
import {
  validateApiKey,
  validateReadonlyPermissions,
} from "@/modules/integrations/binance/infrastructure/binanceClient";

import type {
  BinanceConnection,
  BinanceConnectionStatus,
} from "@/modules/integrations/binance/domain/BinanceConnection";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";

type ConnectBinanceAccountInput = {
  userId:    string;
  apiKey:    string;
  apiSecret: string;
};

type ConnectBinanceAccountResult = {
  ok:         boolean;
  status:     BinanceConnectionStatus;
  message:    string;
  connection: BinanceConnection | null;
};

export async function connectBinanceAccount(
  input: ConnectBinanceAccountInput,
): Promise<ConnectBinanceAccountResult> {
  const userId    = input.userId.trim();
  const apiKey    = input.apiKey.trim();
  const apiSecret = input.apiSecret.trim();

  if (!userId || !apiKey || !apiSecret) {
    return {
      ok:         false,
      status:     "DISCONNECTED",
      message:    "Faltan credenciales obligatorias para conectar Binance.",
      connection: null,
    };
  }

  const apiKeyValidation = await validateApiKey({
    apiKey,
    apiSecret,
  });

  if (!apiKeyValidation.ok) {
    return {
      ok:         false,
      status:     apiKeyValidation.status ?? "INVALID_CREDENTIALS",
      message:    apiKeyValidation.message,
      connection: null,
    };
  }

  const readonlyValidation = await validateReadonlyPermissions({
    apiKey,
    apiSecret,
  });

  if (!readonlyValidation.ok) {
    return {
      ok:         false,
      status:     readonlyValidation.status ?? "READONLY_REQUIRED",
      message:    readonlyValidation.message,
      connection: null,
    };
  }

  const apiKeyEncrypted    = encryptSecret(apiKey);
  const apiSecretEncrypted = encryptSecret(apiSecret);

  const connection = await upsertBinanceConnection({
    userId,
    apiKeyEncrypted,
    apiSecretEncrypted,
    status:      "CONNECTED",
    permissions: readonlyValidation.permissions,
  });

  await recordTimelineEvent({
    userId,
    category: "CONNECTION",
    severity: "SUCCESS",
    title: "Exchange conectado",
    description: "Conectaste tu cuenta Binance en modo solo lectura.",
    entityType: "ExchangeConnection",
    entityId: connection.id,
    metadata: { exchange: "BINANCE", permissions: readonlyValidation.permissions },
  });

  return {
    ok:         true,
    status:     "CONNECTED",
    message:    "Cuenta Binance conectada correctamente en modo solo lectura.",
    connection,
  };
}
