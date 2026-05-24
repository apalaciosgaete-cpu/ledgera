import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 12;

export type PasswordValidationResult = {
  valid: boolean;
  message: string | null;
};

export function validatePasswordComplexity(
  password: string,
): PasswordValidationResult {
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return {
      valid: false,
      message: "La contraseña debe tener entre 8 y 12 caracteres.",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "La contraseña debe incluir al menos una letra mayúscula.",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "La contraseña debe incluir al menos una letra minúscula.",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "La contraseña debe incluir al menos un número.",
    };
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      valid: false,
      message: "La contraseña debe incluir al menos un signo o símbolo.",
    };
  }

  return {
    valid: true,
    message: null,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
