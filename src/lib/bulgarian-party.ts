import {
  validateBulgarianEik,
  validateBulgarianVatNumber,
} from "@/lib/bulgarian-invoice";

export interface BulgarianPartyInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  vatNumber?: string | null;
  taxIdNumber?: string | null;
  registrationNumber?: string | null;
  bulstatNumber?: string | null;
  vatRegistered?: boolean | null;
  vatRegistrationNumber?: string | null;
  mol?: string | null;
  accountablePerson?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankSwift?: string | null;
  bankIban?: string | null;
  uicType?: "BULSTAT" | "EGN" | null;
  locale?: string | null;
}

export interface ValidationIssue {
  path: string[];
  message: string;
}

interface ValidationOptions {
  requireMol?: boolean;
  skipIdentifierFormatValidation?: boolean;
}

/** Когато няма регистрация по ЗДДС, не пазим български ДДС номер (напр. училища, читалища). */
function applyNonVatRegisteredVatClearing(
  normalized: ReturnType<typeof normalizePartyInput<BulgarianPartyInput>>
) {
  if (normalized.vatRegistered) return;
  normalized.vatRegistrationNumber = null;
  const vn = normalized.vatNumber?.toUpperCase();
  if (vn?.startsWith("BG")) normalized.vatNumber = null;
}

function ensureBulgarianVatPrefix(
  normalized: ReturnType<typeof normalizePartyInput<BulgarianPartyInput>>
) {
  const isBulgarian = isBulgarianParty(normalized);
  if (!isBulgarian || !normalized.vatRegistered) return;

  const withPrefix = (value?: string | null) => {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    return trimmed.toUpperCase().startsWith("BG")
      ? trimmed.toUpperCase()
      : `BG${trimmed}`;
  };

  const normalizedVat = withPrefix(
    normalized.vatRegistrationNumber ?? normalized.vatNumber
  );
  if (!normalizedVat) return;

  normalized.vatRegistrationNumber = normalizedVat;
  normalized.vatNumber = normalizedVat;
}

export function normalizePartyInput<T extends BulgarianPartyInput>(input: T): T {
  return {
    ...input,
    name: normalizeText(input.name) ?? "",
    email: normalizeText(input.email),
    phone: normalizeText(input.phone),
    address: normalizeText(input.address),
    city: normalizeText(input.city),
    state: normalizeText(input.state),
    zipCode: normalizeText(input.zipCode),
    country: normalizeText(input.country),
    vatNumber: normalizeVatNumber(input.vatNumber),
    taxIdNumber: normalizeText(input.taxIdNumber),
    registrationNumber: normalizeText(input.registrationNumber),
    bulstatNumber: normalizeIdentifier(input.bulstatNumber),
    vatRegistered: Boolean(input.vatRegistered),
    vatRegistrationNumber: normalizeVatNumber(input.vatRegistrationNumber),
    mol: normalizeText(input.mol),
    accountablePerson: normalizeText(input.accountablePerson),
    bankName: normalizeText(input.bankName),
    bankAccount: normalizeText(input.bankAccount),
    bankSwift: normalizeText(input.bankSwift),
    bankIban: normalizeText(input.bankIban),
    uicType: input.uicType ?? "BULSTAT",
    locale: normalizeText(input.locale) ?? "bg",
  };
}

export function buildPartyPayload(input: BulgarianPartyInput) {
  const normalized = normalizePartyInput(input);
  ensureBulgarianVatPrefix(normalized);
  applyNonVatRegisteredVatClearing(normalized);
  const isBulgarian = isBulgarianParty(normalized);
  const vatNumber =
    normalized.vatRegistrationNumber ?? normalized.vatNumber ?? null;

  return {
    name: normalized.name,
    email: normalized.email,
    phone: normalized.phone,
    address: normalized.address,
    city: normalized.city,
    state: normalized.state,
    zipCode: normalized.zipCode,
    country: normalized.country,
    vatNumber,
    taxIdNumber: normalized.taxIdNumber,
    registrationNumber: normalized.registrationNumber,
    bulstatNumber: normalized.bulstatNumber,
    vatRegistered: normalized.vatRegistered ?? false,
    vatRegistrationNumber: vatNumber,
    mol: normalized.mol,
    accountablePerson: normalized.accountablePerson,
    bankName: normalized.bankName,
    bankAccount: normalized.bankAccount,
    bankSwift: normalized.bankSwift,
    bankIban: normalized.bankIban,
    uicType: normalized.uicType ?? "BULSTAT",
    locale: normalized.locale ?? "bg",
    taxComplianceSystem: isBulgarian ? "bulgarian" : "general",
  };
}

export function validateBulgarianPartyInput(
  input: BulgarianPartyInput,
  options: ValidationOptions = {}
) {
  const normalized = normalizePartyInput(input);
  ensureBulgarianVatPrefix(normalized);
  applyNonVatRegisteredVatClearing(normalized);
  const issues: ValidationIssue[] = [];
  const isBulgarian = isBulgarianParty(normalized);
  const normalizedVat =
    normalized.vatRegistrationNumber ?? normalized.vatNumber ?? null;
  const hasBulgarianVatNumber = Boolean(normalizedVat?.startsWith("BG"));

  if (isBulgarian) {
    if (!normalized.address) {
      issues.push({
        path: ["address"],
        message: "Адресът е задължителен за български контрагент.",
      });
    }

    if (!normalized.city) {
      issues.push({
        path: ["city"],
        message: "Градът е задължителен за български контрагент.",
      });
    }

    if (!normalized.country) {
      issues.push({
        path: ["country"],
        message: "Държавата е задължителна за български контрагент.",
      });
    }
  }

  if (isBulgarian && !normalized.bulstatNumber) {
    issues.push({
      path: ["bulstatNumber"],
      message: "ЕИК/БУЛСТАТ е задължителен за български контрагент.",
    });
  }

  if (
    normalized.bulstatNumber &&
    normalized.uicType !== "EGN" &&
    !options.skipIdentifierFormatValidation
  ) {
    if (!validateBulgarianEik(normalized.bulstatNumber)) {
      issues.push({
        path: ["bulstatNumber"],
        message: "Невалиден ЕИК/БУЛСТАТ номер.",
      });
    }
  }

  if (
    normalized.uicType === "EGN" &&
    normalized.bulstatNumber &&
    !options.skipIdentifierFormatValidation
  ) {
    if (!validateBulgarianEgn(normalized.bulstatNumber)) {
      issues.push({
        path: ["bulstatNumber"],
        message: "Невалидно ЕГН.",
      });
    }
  }

  if (isBulgarian && normalized.vatRegistered && !normalizedVat) {
    issues.push({
      path: ["vatRegistrationNumber"],
      message: "ДДС номерът е задължителен при регистрация по ДДС.",
    });
  }

  if ((isBulgarian || hasBulgarianVatNumber) && normalizedVat && !validateBulgarianVatNumber(normalizedVat)) {
    issues.push({
      path: ["vatRegistrationNumber"],
      message: "Невалиден български ДДС номер. Използвайте формат BGXXXXXXXXX.",
    });
  }

  if (options.requireMol && isBulgarian && !normalized.mol) {
    issues.push({
      path: ["mol"],
      message: "МОЛ е задължително поле за българска фирма.",
    });
  }

  return {
    normalized,
    issues,
  };
}

export function formatValidationIssues(issues: ValidationIssue[]) {
  return issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  }));
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeIdentifier(value?: string | null) {
  const normalized = value?.replace(/\s+/g, "").trim();
  return normalized ? normalized : null;
}

function normalizeVatNumber(value?: string | null) {
  const normalized = value?.replace(/\s+/g, "").toUpperCase().trim();
  return normalized ? normalized : null;
}

function isBulgarianParty(input: BulgarianPartyInput) {
  const country = input.country?.trim().toLowerCase();
  const hasBulgarianVatNumber = Boolean(
    input.vatRegistrationNumber?.trim().toUpperCase().startsWith("BG") ||
      input.vatNumber?.trim().toUpperCase().startsWith("BG")
  );

  return (
    country === "българия" ||
    country === "bulgaria" ||
    country === "bg" ||
    Boolean(input.bulstatNumber) ||
    hasBulgarianVatNumber
  );
}

function validateBulgarianEgn(value: string) {
  return /^\d{10}$/.test(value);
}
