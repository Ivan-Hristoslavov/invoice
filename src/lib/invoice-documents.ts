import { createClientSnapshot, createCompanySnapshot, createItemSnapshots } from "@/lib/document-snapshots";
import { getAccessibleCompaniesForUser, getAccessibleOwnerUserIdsForUser } from "@/lib/team";

export async function fetchOwnedCompanyAndClient(
  supabase: any,
  userId: string,
  companyId: string,
  clientId: string
) {
  const [accessibleCompanies, accessibleOwnerIds] = await Promise.all([
    getAccessibleCompaniesForUser(userId),
    getAccessibleOwnerUserIdsForUser(userId),
  ]);

  const accessibleCompanyIds = accessibleCompanies.map((company) => company.id);

  const [{ data: company, error: companyError }, { data: client, error: clientError }] =
    await Promise.all([
      supabase
        .from("Company")
        .select("*")
        .eq("id", companyId)
        .in("id", accessibleCompanyIds)
        .maybeSingle(),
      supabase
        .from("Client")
        .select("*")
        .eq("id", clientId)
        .in("userId", accessibleOwnerIds)
        .maybeSingle(),
    ]);

  if (companyError) throw companyError;
  if (clientError) throw clientError;

  return { company, client };
}

export async function fetchProductsByIds(
  supabase: any,
  userId: string,
  productIds: string[]
) {
  if (productIds.length === 0) return new Map<string, Record<string, any>>();

  const accessibleOwnerIds = await getAccessibleOwnerUserIdsForUser(userId);

  const { data: products, error } = await supabase
    .from("Product")
    .select("id, name, unit, taxRate")
    .in("id", productIds)
    .in("userId", accessibleOwnerIds);

  if (error) throw error;

  return new Map<string, Record<string, any>>(
    (products || []).map((product: Record<string, any>) => [product.id, product])
  );
}

export function prepareDocumentItems(
  items: Array<Record<string, any>>,
  productById: Map<string, Record<string, any>>
) {
  let subtotal = 0;
  let taxAmount = 0;

  const preparedItems = items.map((item) => {
    const itemPrice = Number(item.price ?? item.unitPrice ?? 0);
    const itemQuantity = Number(item.quantity ?? 0);
    const itemTaxRate =
      item.taxRate !== undefined
        ? Number(item.taxRate)
        : Number(productById.get(item.productId || "")?.taxRate ?? 0);
    const lineSubtotal = itemPrice * itemQuantity;
    const lineTax = lineSubtotal * (itemTaxRate / 100);
    const product = item.productId ? productById.get(item.productId) : null;

    subtotal += lineSubtotal;
    taxAmount += lineTax;

    const rawReason = typeof item.vatExemptReason === "string" ? item.vatExemptReason.trim() : "";
    const vatExemptReason = rawReason.length > 0 ? rawReason : null;

    return {
      id: item.id,
      productId: item.productId || null,
      description: item.description,
      quantity: itemQuantity,
      unitPrice: itemPrice,
      unit: item.unit || product?.unit || "бр.",
      taxRate: itemTaxRate,
      vatExemptReason,
      subtotal: lineSubtotal,
      taxAmount: lineTax,
      total: lineSubtotal + lineTax,
    };
  });

  return {
    preparedItems,
    subtotal,
    taxAmount,
    total: subtotal + taxAmount,
  };
}

export function createDocumentSnapshots(
  company: Record<string, any>,
  client: Record<string, any>,
  preparedItems: Array<Record<string, any>>,
  productById: Map<string, Record<string, any>>
) {
  return {
    sellerSnapshot: createCompanySnapshot(company),
    buyerSnapshot: createClientSnapshot(client),
    itemsSnapshot: createItemSnapshots(preparedItems, productById),
  };
}
