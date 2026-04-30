import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockResolveSessionUser = vi.fn();
const mockCreateAdminClient = vi.fn();
const mockFetchOwnedCompanyAndClient = vi.fn();
const mockFetchProductsByIds = vi.fn();
const mockPrepareDocumentItems = vi.fn();
const mockCreateDocumentSnapshots = vi.fn();
const mockGetNextProformaSequence = vi.fn();
const mockRollbackProformaSequence = vi.fn();

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/session-user", () => ({ resolveSessionUser: mockResolveSessionUser }));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: mockCreateAdminClient }));
vi.mock("@/lib/invoice-documents", () => ({
  fetchOwnedCompanyAndClient: mockFetchOwnedCompanyAndClient,
  fetchProductsByIds: mockFetchProductsByIds,
  prepareDocumentItems: mockPrepareDocumentItems,
  createDocumentSnapshots: mockCreateDocumentSnapshots,
}));
vi.mock("@/lib/invoice-sequence", () => ({
  getNextProformaSequence: mockGetNextProformaSequence,
  rollbackProformaSequence: mockRollbackProformaSequence,
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/proforma-invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/proforma-invoices", () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue({ user: { id: "session-user" } });
    mockResolveSessionUser.mockResolvedValue({ id: "user_1" });
    mockFetchProductsByIds.mockResolvedValue({});
    mockCreateDocumentSnapshots.mockReturnValue({
      sellerSnapshot: { name: "Тест ООД" },
      buyerSnapshot: { name: "Клиент ЕООД" },
      itemsSnapshot: [{ description: "Услуга" }],
    });
    mockGetNextProformaSequence.mockResolvedValue({ sequence: 1, proformaNumber: "PF-2026-000001" });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 404 when company or client is missing", async () => {
    mockFetchOwnedCompanyAndClient.mockResolvedValue({ company: null, client: null });
    const { POST } = await import("@/app/api/proforma-invoices/route");
    const response = await POST(
      createRequest({
        clientId: "client_1",
        companyId: "company_1",
        issueDate: "2026-04-30",
        items: [{ description: "Услуга", quantity: 1, price: 10, taxRate: 20 }],
      })
    );
    expect(response.status).toBe(404);
  });

  it("creates proforma with server totals", async () => {
    const inserted: { invoice?: any; items?: any[] } = {};
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "ProformaInvoice") {
          return {
            insert: vi.fn(async (payload: any) => {
              inserted.invoice = payload;
              return { error: null };
            }),
          };
        }
        if (table === "ProformaInvoiceItem") {
          return {
            insert: vi.fn(async (payload: any[]) => {
              inserted.items = payload;
              return { error: null };
            }),
          };
        }
        return { delete: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })) };
      }),
    };
    mockCreateAdminClient.mockReturnValue(supabase);
    mockFetchOwnedCompanyAndClient.mockResolvedValue({
      company: { id: "company_1", name: "Тест ООД" },
      client: { id: "client_1", name: "Клиент ЕООД" },
    });
    mockPrepareDocumentItems.mockReturnValue({
      preparedItems: [{
        id: "item_1",
        productId: null,
        description: "Услуга",
        quantity: 2,
        unitPrice: 100,
        unit: "бр.",
        taxRate: 20,
        subtotal: 200,
        taxAmount: 40,
        total: 240,
      }],
      subtotal: 200,
      taxAmount: 40,
      total: 240,
    });

    const { POST } = await import("@/app/api/proforma-invoices/route");
    const response = await POST(
      createRequest({
        clientId: "client_1",
        companyId: "company_1",
        issueDate: "2026-04-30",
        items: [{ description: "Услуга", quantity: 2, price: 999, taxRate: 20 }],
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(inserted.invoice).toEqual(expect.objectContaining({
      subtotal: "200",
      taxAmount: "40",
      total: "240",
      proformaNumber: "PF-2026-000001",
    }));
    expect(inserted.items?.[0]).toEqual(expect.objectContaining({ description: "Услуга", total: "240" }));
    expect(body.success).toBe(true);
  });
});
