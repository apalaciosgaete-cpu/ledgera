export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

export type PasswordValidationResult = {
  valid: boolean;
  message: string | null;
};

export type PasswordRequirement = {
  id: string;
  label: string;
  isMet: (password: string) => boolean;
};

type PasswordRequirementPolicy = PasswordRequirement & {
  message: string;
};

const PASSWORD_REQUIREMENT_POLICIES: PasswordRequirementPolicy[] = [
  {
    id: "length",
    label: "Entre 8 y 64 caracteres",
    isMet: (password) =>
      password.length >= PASSWORD_MIN_LENGTH &&
      password.length <= PASSWORD_MAX_LENGTH,
    message: "La contraseña debe tener entre 8 y 64 caracteres.",
  },
  {
    id: "uppercase",
    label: "Una letra mayúscula",
    isMet: (password) => /[A-Z]/.test(password),
    message: "La contraseña debe incluir al menos una letra mayúscula.",
  },
  {
    id: "lowercase",
    label: "Una letra minúscula",
    isMet: (password) => /[a-z]/.test(password),
    message: "La contraseña debe incluir al menos una letra minúscula.",
  },
  {
    id: "number",
    label: "Un número",
    isMet: (password) => /[0-9]/.test(password),
    message: "La contraseña debe incluir al menos un número.",
  },
  {
    id: "symbol",
    label: "Un signo o símbolo",
    isMet: (password) => /[^A-Za-z0-9]/.test(password),
    message: "La contraseña debe incluir al menos un signo o símbolo.",
  },
];

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] =
  PASSWORD_REQUIREMENT_POLICIES.map(({ id, label, isMet }) => ({
    id,
    label,
    isMet,
  }));

export function validatePasswordComplexity(
  password: string,
): PasswordValidationResult {
  const failedRequirement = PASSWORD_REQUIREMENT_POLICIES.find(
    (requirement) => !requirement.isMet(password),
  );

  if (failedRequirement) {
    return {
      valid: false,
      message: failedRequirement.message,
    };
  }

  return {
    valid: true,
    message: null,
  };
}

