const MISSING_SECRET_MESSAGE = "Configuración crítica faltante.";

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${MISSING_SECRET_MESSAGE} Variable requerida: ${name}`);
  }

  return value;
}

export function optionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}
