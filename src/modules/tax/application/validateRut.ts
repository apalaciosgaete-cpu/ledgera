import type { TaxProfileValidationResult } from "@/modules/tax/domain/taxProfile";

export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9Kk]/g, "").toUpperCase();
}

export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);

  if (cleaned.length < 2) return cleaned;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${formattedBody}-${dv}`;
}

function calculateDv(body: string): string {
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const dv = 11 - remainder;

  if (dv === 11) return "0";
  if (dv === 10) return "K";

  return String(dv);
}

export function validateRut(rut: string): TaxProfileValidationResult {
  const cleaned = cleanRut(rut);

  if (cleaned.length < 2) {
    return { valid: false, message: "RUT incompleto." };
  }

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  if (!/^\d+$/.test(body)) {
    return { valid: false, message: "RUT con cuerpo numérico inválido." };
  }

  const expectedDv = calculateDv(body);

  if (dv !== expectedDv) {
    return { valid: false, message: "Dígito verificador incorrecto." };
  }

  return {
    valid: true,
    normalized: formatRut(rut),
  };
}
