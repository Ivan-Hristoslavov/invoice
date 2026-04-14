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
