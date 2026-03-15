/**
 * Shared validation: email format and password strength.
 */

// RFC 5322–style simplified; matches most real addresses without being too loose
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export function isValidEmail(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

export function getEmailValidationError(value: string): string | null {
  if (!value?.trim()) return "Имейл адресът е задължителен";
  if (!isValidEmail(value.trim())) return "Моля, въведете валиден имейл адрес";
  return null;
}

const MIN_LENGTH = 8;
const STRONG_MIN_LENGTH = 10;

/** Common weak passwords (lowercase) */
const WEAK_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password1",
  "password123",
  "qwerty123",
  "qwertyuiop",
  "abc12345",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "master",
  "login",
  "princess",
  "football",
  "iloveyou",
  "admin",
  "admin123",
  "passw0rd",
  "parola",
  "parola123",
  "парола",
]);

function isCommonWeak(password: string): boolean {
  return WEAK_PASSWORDS.has(password.toLowerCase().trim());
}

/** Returns true if password is only digits or only same digit repeated */
function isOnlyDigitsOrRepetitive(password: string): boolean {
  if (!/^\d+$/.test(password)) return false;
  if (password.length < 8) return true;
  const first = password[0];
  return password.split("").every((c) => c === first);
}

export type PasswordStrengthLevel = 0 | 1 | 2 | 3;

export interface PasswordStrength {
  level: PasswordStrengthLevel;
  label: string;
  /** True if password is too weak to accept (e.g. common or only digits) */
  isTooWeak: boolean;
  /** Human-readable requirements not met */
  hints: string[];
}

const LABELS: Record<PasswordStrengthLevel, string> = {
  0: "Слаба",
  1: "Средна",
  2: "Добра",
  3: "Силна",
};

export function getPasswordStrength(password: string): PasswordStrength {
  const hints: string[] = [];
  if (!password) {
    return { level: 0, label: LABELS[0], isTooWeak: true, hints: ["Мин. 8 символа"] };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const len = password.length;

  if (len < MIN_LENGTH) {
    hints.push(`Мин. ${MIN_LENGTH} символа (в момента ${len})`);
    return { level: 0, label: LABELS[0], isTooWeak: true, hints };
  }

  if (isCommonWeak(password) || isOnlyDigitsOrRepetitive(password)) {
    return {
      level: 0,
      label: LABELS[0],
      isTooWeak: true,
      hints: ["Паролата е твърде лесна или често използвана"],
    };
  }

  const types = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  if (types === 1) {
    hints.push("Добавете малки и главни букви, цифри или специални символи");
    return { level: 0, label: LABELS[0], isTooWeak: true, hints };
  }

  if (len >= STRONG_MIN_LENGTH && hasLower && hasUpper && hasDigit && hasSpecial) {
    return { level: 3, label: LABELS[3], isTooWeak: false, hints: [] };
  }

  if (types >= 3 || (len >= STRONG_MIN_LENGTH && types >= 2)) {
    if (types < 4) hints.push("Добавете специален символ за по-силна парола");
    return { level: 2, label: LABELS[2], isTooWeak: false, hints };
  }

  hints.push("Добавете главни букви, цифри или специални символи");
  return { level: 1, label: LABELS[1], isTooWeak: false, hints };
}

/** Returns error message if password is not acceptable for registration */
export function getPasswordValidationError(password: string): string | null {
  if (!password) return "Паролата е задължителна";
  if (password.length < MIN_LENGTH) return `Паролата трябва да е поне ${MIN_LENGTH} символа`;
  const strength = getPasswordStrength(password);
  if (strength.isTooWeak) return strength.hints[0] || "Изберете по-силна парола";
  return null;
}
