export interface CompanyBookSeat {
  country: string;
  district: string;
  municipality: string;
  settlement: string;
  postCode: string;
  street: string;
  streetNumber: string;
  block: string;
  entrance: string;
  floor: string;
  apartment: string;
}

export interface CompanyBookRegisterInfo {
  vat: string;
  address: string;
  region: string;
  municipality: string;
  settlement: string;
  registrationBasis: string;
  registrationDate: string;
}

export interface CompanyBookManager {
  name: string;
  countryName: string;
}

export interface CompanyBookCompany {
  id: string;
  uic: string;
  companyName: { name: string };
  companyNameTransliteration?: { name: string };
  legalForm: string;
  status: string;
  seat: CompanyBookSeat;
  correspondenceSeat?: CompanyBookSeat;
  contacts: { phone: string; fax: string; email: string; url: string };
  subjectOfActivity: string;
  managers: CompanyBookManager[];
  registerInfo?: CompanyBookRegisterInfo;
}

export interface CompanyBookResponse {
  company: CompanyBookCompany;
}

export interface CompanyBookSearchCompanyItem {
  uic: string;
  name: string;
  legalForm?: string;
  status?: string;
  transliteration?: string;
}

export interface CompanyBookSearchPersonItem {
  id: string;
  name: string;
  indent: string;
  companies?: number;
}

export interface CompanyBookCompaniesSearchResponse {
  results: CompanyBookSearchCompanyItem[];
  total: number;
}

export interface CompanyBookPeopleSearchResponse {
  results: CompanyBookSearchPersonItem[];
  total: number;
}

export interface CompanyBookSharedSearchResponse {
  companies: CompanyBookSearchCompanyItem[];
  people: CompanyBookSearchPersonItem[];
}

const DEFAULT_API_BASE = "https://api.companybook.bg/api";
const DEFAULT_FETCH_TIMEOUT_MS = 20_000;

export class CompanyBookHttpError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "CompanyBookHttpError";
    this.status = status;
    this.payload = payload;
  }
}

export function getCompanyBookConfig() {
  const apiKey = (
    process.env.COMPANYBOOK_API_KEY ||
    process.env.COMPANY_BOOK_API_KEY ||
    ""
  ).trim();

  const rawBase = (
    process.env.COMPANYBOOK_API_BASE ||
    process.env.COMPANY_BOOK_API_BASE_URL ||
    DEFAULT_API_BASE
  ).trim();

  return {
    apiKey,
    apiBase: normalizeCompanyBookApiBase(rawBase || DEFAULT_API_BASE),
  };
}

export function normalizeCompanyBookApiBase(rawBase: string) {
  const trimmed = rawBase.trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_API_BASE;
  return trimmed.replace(/\/api\/companies$/i, "/api");
}

export function buildCompanyBookUrl(
  apiBase: string,
  endpointPath: string,
  query?: Record<string, string | number | boolean | null | undefined>
) {
  const cleanPath = endpointPath.replace(/^\/+/, "");
  const url = new URL(`${apiBase}/${cleanPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

export async function fetchCompanyBookJson<T>(
  endpointPath: string,
  options?: {
    query?: Record<string, string | number | boolean | null | undefined>;
    timeoutMs?: number;
  }
) {
  const { apiBase, apiKey } = getCompanyBookConfig();
  if (!apiKey) {
    throw new CompanyBookHttpError(
      "CompanyBook API key is missing",
      503,
      { configMissing: true }
    );
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const url = buildCompanyBookUrl(apiBase, endpointPath, options?.query);

  const response = await fetch(url, {
    headers: {
      "X-API-Key": apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  const responseText = await response.text();
  const payload = safeParseJson(responseText);

  if (!response.ok) {
    const message = extractCompanyBookErrorMessage(payload) || `CompanyBook request failed with status ${response.status}`;
    throw new CompanyBookHttpError(message, response.status, payload);
  }

  return payload as T;
}

function buildAddress(seat: CompanyBookSeat): string {
  const parts: string[] = [];
  if (seat.street) {
    let streetPart = seat.street.replace(/^"|"$/g, "");
    if (seat.streetNumber) streetPart += ` №${seat.streetNumber}`;
    parts.push(streetPart);
  }
  if (seat.block) parts.push(`бл. ${seat.block}`);
  if (seat.entrance) parts.push(`вх. ${seat.entrance}`);
  if (seat.floor) parts.push(`ет. ${seat.floor}`);
  if (seat.apartment) parts.push(`ап. ${seat.apartment}`);
  return parts.join(", ");
}

function extractCity(seat: CompanyBookSeat): string {
  const settlement = seat.settlement || "";
  return settlement.replace(/^гр\.\s*/, "").replace(/^с\.\s*/, "").trim();
}

export function mapCompanyBookToFormFields(data: CompanyBookResponse) {
  const c = data.company;
  const seat = c.seat;
  const hasVat = !!c.registerInfo?.vat;
  const vatNumber = c.registerInfo?.vat || "";
  const mol = c.managers?.[0]?.name || "";

  return {
    name: c.companyName.name,
    address: buildAddress(seat),
    city: extractCity(seat),
    state: seat.district || "",
    zipCode: seat.postCode || "",
    country: "България",
    bulstatNumber: c.uic,
    vatRegistered: hasVat,
    vatRegistrationNumber: vatNumber,
    vatNumber: vatNumber,
    mol,
    email: c.contacts?.email || "",
    phone: c.contacts?.phone || "",
    uicType: "BULSTAT" as const,
  };
}

export type CompanyBookFormFields = ReturnType<typeof mapCompanyBookToFormFields>;

function safeParseJson(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function extractCompanyBookErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const direct = "error" in payload ? (payload as { error?: unknown }).error : null;
  if (typeof direct === "string" && direct.trim()) return direct;
  return null;
}
