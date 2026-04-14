/** EU VIES VAT validation helpers (European Commission VIES). */

export const VIES_REST_CHECK_URL =
  "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

const MS_CODE_FOR_API: Record<string, string> = {
  /** Greece: national VAT uses EL in VIES */
  GR: "EL",
};

/** Display country names (Bulgarian) for EU member states used in VIES */
export const EU_COUNTRY_NAME_BG: Record<string, string> = {
  AT: "Австрия",
  BE: "Белгия",
  BG: "България",
  HR: "Хърватия",
  CY: "Кипър",
  CZ: "Чехия",
  DK: "Дания",
  EE: "Естония",
  FI: "Финландия",
  FR: "Франция",
  DE: "Германия",
  EL: "Гърция",
  GR: "Гърция",
  HU: "Унгария",
  IE: "Ирландия",
  IT: "Италия",
  LV: "Латвия",
  LT: "Литва",
  LU: "Люксембург",
  MT: "Малта",
  NL: "Нидерландия",
  PL: "Полша",
  PT: "Португалия",
  RO: "Румъния",
  SK: "Словакия",
  SI: "Словения",
  ES: "Испания",
  SE: "Швеция",
  XI: "Северна Ирландия",
};

export interface ParsedEuVatInput {
  /** Two-letter code as sent to VIES (e.g. EL for Greece) */
  countryCode: string;
  /** VAT number without country prefix */
  vatLocal: string;
  /** Original two-letter prefix from user input (before GR→EL) */
  inputPrefix: string;
}

export function parseEuVatInput(raw: string): ParsedEuVatInput | null {
  const cleaned = raw.replace(/[\s.]/g, "").toUpperCase();
  if (cleaned.length < 4) return null;
  const prefix = cleaned.slice(0, 2);
  if (!/^[A-Z]{2}$/.test(prefix)) return null;
  const rest = cleaned.slice(2);
  if (!rest) return null;
  const countryCode = MS_CODE_FOR_API[prefix] ?? prefix;
  return { countryCode, vatLocal: rest, inputPrefix: prefix };
}

export interface ViesRestResponse {
  countryCode?: string;
  vatNumber?: string;
  requestDate?: string;
  valid?: boolean;
  name?: string;
  address?: string;
  userError?: string;
}

function cleanViesText(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const t = value.trim();
  if (!t || t === "---") return null;
  return t;
}

export function extractCityFromViesAddress(address: string): string | undefined {
  const g = address.match(/гр\.\s*([^,]+)/i);
  if (g?.[1]) return g[1].trim();
  const lines = address.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  if (lines.length >= 2) return lines[lines.length - 1];
  return undefined;
}

export interface ViesFormAutofill {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  vatRegistrationNumber?: string;
  vatNumber?: string;
  vatRegistered?: boolean;
  bulstatNumber?: string;
}

export interface ViesPersistencePayload {
  viesLastCheckAt: string;
  viesValid: boolean;
  viesCountryCode: string;
  viesNumberLocal: string;
  viesTraderName: string | null;
  viesTraderAddress: string | null;
}

export interface ViesValidateResult {
  ok: boolean;
  valid: boolean;
  countryCode: string;
  vatNumberLocal: string;
  requestDate?: string;
  traderName: string | null;
  traderAddress: string | null;
  formFields: ViesFormAutofill;
  persistence: ViesPersistencePayload;
  errorCode?: "INVALID_INPUT" | "SERVICE_ERROR" | "PARSE_ERROR";
  message?: string;
}

export function buildViesAutofillAndPersistence(
  parsed: ParsedEuVatInput,
  api: ViesRestResponse
): ViesValidateResult {
  const nowIso = new Date().toISOString();
  const valid = Boolean(api.valid);
  const traderName = cleanViesText(api.name);
  const traderAddressRaw = cleanViesText(api.address);
  const countryBg = EU_COUNTRY_NAME_BG[parsed.countryCode] ?? EU_COUNTRY_NAME_BG[parsed.inputPrefix];

  const formFields: ViesFormAutofill = {};
  if (valid && traderName) formFields.name = traderName;
  if (valid && traderAddressRaw) {
    formFields.address = traderAddressRaw.replace(/\n+/g, ", ").trim();
    const cityGuess = extractCityFromViesAddress(traderAddressRaw);
    if (cityGuess) formFields.city = cityGuess;
  }
  if (valid && countryBg) formFields.country = countryBg;
  if (valid) {
    formFields.vatRegistered = true;
    const fullVat = `${parsed.countryCode}${parsed.vatLocal}`;
    formFields.vatRegistrationNumber = fullVat;
    formFields.vatNumber = fullVat;
    if (parsed.countryCode === "BG" && /^\d+$/.test(parsed.vatLocal)) {
      formFields.bulstatNumber = parsed.vatLocal;
    }
  }

  const persistence: ViesPersistencePayload = {
    viesLastCheckAt: nowIso,
    viesValid: valid,
    viesCountryCode: parsed.countryCode,
    viesNumberLocal: parsed.vatLocal,
    viesTraderName: traderName,
    viesTraderAddress: traderAddressRaw,
  };

  return {
    ok: true,
    valid,
    countryCode: parsed.countryCode,
    vatNumberLocal: parsed.vatLocal,
    requestDate: api.requestDate,
    traderName,
    traderAddress: traderAddressRaw,
    formFields,
    persistence,
  };
}

export async function fetchViesCheckVatNumber(
  countryCode: string,
  vatLocal: string,
  timeoutMs = 25_000
): Promise<ViesRestResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(VIES_REST_CHECK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ countryCode, vatNumber: vatLocal }),
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return { valid: false, userError: "INVALID_RESPONSE" };
    }
    if (!res.ok) {
      return {
        valid: false,
        userError: typeof data === "object" && data && "message" in data
          ? String((data as { message?: unknown }).message)
          : `HTTP_${res.status}`,
      };
    }
    return data as ViesRestResponse;
  } finally {
    clearTimeout(timer);
  }
}
