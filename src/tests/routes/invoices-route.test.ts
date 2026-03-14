import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockResolveSessionUser = vi.fn();
const mockCreateAdminClient = vi.fn();
const mockCheckSubscriptionLimits = vi.fn();
const mockFetchOwnedCompanyAndClient = vi.fn();
const mockFetchProductsByIds = vi.fn();
const mockPrepareDocumentItems = vi.fn();
const mockCreateDocumentSnapshots = vi.fn();
const mockGetNextInvoiceSequence = vi.fn();
const mockLogAction = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/session-user", () => ({
  resolveSessionUser: mockResolveSessionUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("@/middleware/subscription", () => ({
  checkSubscriptionLimits: mockCheckSubscriptionLimits,
}));

vi.mock("@/middleware/rate-limiter", () => ({
  withRateLimit: (_request: NextRequest, handler: () => Promise<Response>) => handler(),
}));

vi.mock("@/middleware/error-handler", () => ({
  withErrorHandling: (_request: NextRequest, handler: () => Promise<Response>) => handler(),
}));

vi.mock("@/middleware/authorization", () => ({
  withAuthorization: (_request: NextRequest, handler: () => Promise<Response>) => handler(),
}));

vi.mock("@/lib/invoice-documents", () => ({
  fetchOwnedCompanyAndClient: mockFetchOwnedCompanyAndClient,
  fetchProductsByIds: mockFetchProductsByIds,
  prepareDocumentItems: mockPrepareDocumentItems,
  createDocumentSnapshots: mockCreateDocumentSnapshots,
}));

vi.mock("@/lib/invoice-sequence", () => ({
  getNextInvoiceSequence: mockGetNextInvoiceSequence,
}));

vi.mock("@/lib/audit-log", () => ({
  logAction: mockLogAction,
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify(body),
  });
}

function createInvoiceSupabaseMock() {
  let insertedInvoicePayload: Record<string, unknown> | null = null;
  let insertedItemsPayload: Array<Record<string, unknown>> = [];
  let invoiceCallCount = 0;

  const raceCheckQuery = {
    select: vi.fn(() => raceCheckQuery),
    eq: vi.fn(() => raceCheckQuery),
    single: vi.fn(async () => ({ data: null, error: null })),
  };

  const invoiceInsertBuilder = {
    insert: vi.fn((payload: Record<string, unknown>) => {
      insertedInvoicePayload = payload;
      return {
        select: () => ({
          single: async () => ({
            data: { id: payload.id, status: payload.status },
            error: null,
          }),
        }),
      };
    }),
  };

  const invoiceFetchQuery = {
    select: vi.fn(() => invoiceFetchQuery),
    eq: vi.fn(() => invoiceFetchQuery),
    single: vi.fn(async () => ({
      data: {
        id: "invoice_1",
        status: "DRAFT",
        invoiceNumber: "260000000001",
        items: insertedItemsPayload,
        client: { id: "client_1", name: "Клиент ЕООД" },
        company: { id: "company_1", name: "Тест ООД" },
      },
      error: null,
    })),
  };

  const invoiceItemInsertBuilder = {
    insert: vi.fn(async (payload: Array<Record<string, unknown>>) => {
      insertedItemsPayload = payload;
      return { error: null };
    }),
  };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "Invoice") {
        invoiceCallCount += 1;
        if (invoiceCallCount === 1) return raceCheckQuery;
        if (invoiceCallCount === 2) return invoiceInsertBuilder;
        return invoiceFetchQuery;
      }

      if (table === "InvoiceItem") {
        return invoiceItemInsertBuilder;
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };

  return {
    supabase,
    getInsertedInvoicePayload: () => insertedInvoicePayload,
    getInsertedItemsPayload: () => insertedItemsPayload,
  };
}

describe("POST /api/invoices route", () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue({ user: { id: "session-user" } });
    mockResolveSessionUser.mockResolvedValue({ id: "user_1" });
    mockCheckSubscriptionLimits.mockResolvedValue({ allowed: true });
    mockFetchProductsByIds.mockResolvedValue({});
    mockCreateDocumentSnapshots.mockReturnValue({
      sellerSnapshot: { name: "Тест ООД" },
      buyerSnapshot: { name: "Клиент ЕООД" },
      itemsSnapshot: [{ description: "Услуга" }],
    });
    mockGetNextInvoiceSequence.mockResolvedValue({
      sequence: 1,
      invoiceNumber: "260000000001",
    });
    mockLogAction.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 404 when company or client is missing", async () => {
    mockFetchOwnedCompanyAndClient.mockResolvedValue({ company: null, client: null });

    const { POST } = await import("@/app/api/invoices/route");

    const response = await POST(
      createRequest({
        clientId: "client_1",
        companyId: "company_1",
        issueDate: "2026-03-14",
        dueDate: "2026-03-20",
        items: [{ description: "Услуга", quantity: 1, price: 0, taxRate: 20 }],
      })
    );

    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Компанията не е намерена");
  });

  it("creates invoice rows with server-computed totals and draft status", async () => {
    const { supabase, getInsertedInvoicePayload, getInsertedItemsPayload } = createInvoiceSupabaseMock();
    mockCreateAdminClient.mockReturnValue(supabase);
    mockFetchOwnedCompanyAndClient.mockResolvedValue({
      company: { id: "company_1", bulstatNumber: "204676177", name: "Тест ООД" },
      client: { id: "client_1", name: "Клиент ЕООД" },
    });
    mockPrepareDocumentItems.mockReturnValue({
      preparedItems: [
        {
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
        },
      ],
      subtotal: 200,
      taxAmount: 40,
      total: 240,
    });

    const { POST } = await import("@/app/api/invoices/route");

    const response = await POST(
      createRequest({
        clientId: "client_1",
        companyId: "company_1",
        issueDate: "2026-03-14",
        dueDate: "2026-03-20",
        status: "ISSUED",
        paymentMethod: "CARD",
        items: [{ description: "Услуга", quantity: 2, price: 999, taxRate: 20 }],
      })
    );

    const body = await response.json();
    const insertedInvoicePayload = getInsertedInvoicePayload();
    const insertedItemsPayload = getInsertedItemsPayload();

    expect(response.status).toBe(201);
    expect(insertedInvoicePayload).toEqual(
      expect.objectContaining({
        status: "DRAFT",
        subtotal: "200",
        taxAmount: "40",
        total: "240",
        paymentMethod: "CREDIT_CARD",
        sellerSnapshot: { name: "Тест ООД" },
      })
    );
    expect(insertedItemsPayload).toEqual([
      expect.objectContaining({
        description: "Услуга",
        quantity: "2",
        unitPrice: "100",
        unit: "бр.",
        total: "240",
      }),
    ]);
    expect(body.success).toBe(true);
  });
});
