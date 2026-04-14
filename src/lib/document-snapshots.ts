type CompanyRecord = Record<string, any> | null | undefined;
type ClientRecord = Record<string, any> | null | undefined;
type ItemRecord = Record<string, any>;

/** Person receiving goods on an invoice (optional; may differ from buyer MOL). */
export type GoodsRecipientInput = {
  name?: string | null;
  phone?: string | null;
  mol?: string | null;
};

export type GoodsRecipientSnapshot = {
  name: string | null;
  phone: string | null;
  mol: string | null;
};

export function createGoodsRecipientSnapshot(
  input: GoodsRecipientInput | null | undefined
): GoodsRecipientSnapshot | null {
  if (!input || typeof input !== "object") return null;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const mol = typeof input.mol === "string" ? input.mol.trim() : "";
  if (!name && !phone && !mol) return null;
  return {
    name: name || null,
    phone: phone || null,
    mol: mol || null,
  };
}

export function createCompanySnapshot(company: CompanyRecord) {
  if (!company) return null;

  return {
    id: company.id ?? null,
    name: company.name ?? null,
    logo: company.logo ?? null,
    email: company.email ?? null,
    phone: company.phone ?? null,
    address: company.address ?? null,
    city: company.city ?? null,
    state: company.state ?? null,
    zipCode: company.zipCode ?? null,
    country: company.country ?? null,
    vatNumber: company.vatNumber ?? company.vatRegistrationNumber ?? null,
    vatRegistered: Boolean(company.vatRegistered),
    vatRegistrationNumber: company.vatRegistrationNumber ?? company.vatNumber ?? null,
    bulstatNumber: company.bulstatNumber ?? null,
    mol: company.mol ?? null,
    accountablePerson: company.accountablePerson ?? null,
    uicType: company.uicType ?? null,
    taxComplianceSystem: company.taxComplianceSystem ?? null,
    bankName: company.bankName ?? null,
    bankAccount: company.bankAccount ?? null,
    bankIban: company.bankIban ?? null,
    bankSwift: company.bankSwift ?? null,
    bankAccountDetails:
      company.bankAccount && typeof company.bankAccount === "object"
        ? company.bankAccount
        : {
            bankName: company.bankName ?? null,
            accountNumber: null,
            iban: company.bankIban ?? null,
            swift: company.bankSwift ?? null,
          },
  };
}

export function createClientSnapshot(client: ClientRecord) {
  if (!client) return null;

  return {
    id: client.id ?? null,
    name: client.name ?? null,
    email: client.email ?? null,
    phone: client.phone ?? null,
    address: client.address ?? null,
    city: client.city ?? null,
    state: client.state ?? null,
    zipCode: client.zipCode ?? null,
    country: client.country ?? null,
    vatNumber: client.vatNumber ?? client.vatRegistrationNumber ?? null,
    vatRegistered: Boolean(client.vatRegistered),
    vatRegistrationNumber: client.vatRegistrationNumber ?? client.vatNumber ?? null,
    bulstatNumber: client.bulstatNumber ?? null,
    mol: client.mol ?? null,
    uicType: client.uicType ?? null,
    locale: client.locale ?? "bg",
    taxComplianceSystem: client.taxComplianceSystem ?? null,
  };
}

export function createItemSnapshots(
  items: ItemRecord[],
  productById: Map<string, Record<string, any>>
) {
  return items.map((item) => {
    const product =
      item.productId && productById.has(item.productId)
        ? productById.get(item.productId)
        : null;

    return {
      productId: item.productId ?? null,
      description: item.description,
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? item.price ?? 0),
      taxRate: Number(item.taxRate ?? 0),
      subtotal: Number(item.subtotal ?? 0),
      taxAmount: Number(item.taxAmount ?? 0),
      total: Number(item.total ?? 0),
      unit: item.unit ?? product?.unit ?? "бр.",
    };
  });
}

export function withDocumentSnapshots<T extends Record<string, any>>(
  record: T,
  liveCompany?: CompanyRecord,
  liveClient?: ClientRecord,
  liveItems?: ItemRecord[]
) {
  const companySnapshot =
    isPlainObject(record.sellerSnapshot) ? record.sellerSnapshot : null;
  const clientSnapshot =
    isPlainObject(record.buyerSnapshot) ? record.buyerSnapshot : null;
  const itemsSnapshot = Array.isArray(record.itemsSnapshot)
    ? record.itemsSnapshot
    : null;

  // Snapshots historically omitted `logo`; merge from live company so PDF/email can embed it.
  const company =
    companySnapshot && liveCompany
      ? {
          ...companySnapshot,
          logo: companySnapshot.logo ?? liveCompany.logo ?? null,
        }
      : companySnapshot ?? liveCompany ?? null;

  return {
    ...record,
    company,
    client: clientSnapshot ?? liveClient ?? null,
    items: itemsSnapshot ?? liveItems ?? [],
  };
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
