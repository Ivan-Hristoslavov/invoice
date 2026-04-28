import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockResolveSessionUser = vi.fn();
const mockCreateAdminClient = vi.fn();
const mockFetchOwnedCompanyAndClient = vi.fn();
const mockFetchProductsByIds = vi.fn();
const mockPrepareDocumentItems = vi.fn();
const mockCreateDocumentSnapshots = vi.fn();
const mockGetNextInvoiceSequence = vi.fn();
const mockRollbackInvoiceSequence = vi.fn();

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

vi.mock("@/lib/invoice-documents", () => ({
  fetchOwnedCompanyAndClient: mockFetchOwnedCompanyAndClient,
  fetchProductsByIds: mockFetchProductsByIds,
  prepareDocumentItems: mockPrepareDocumentItems,
  createDocumentSnapshots: mockCreateDocumentSnapshots,
}));

vi.mock("@/lib/invoice-sequence", () => ({
  getNextInvoiceSequence: mockGetNextInvoiceSequence,
  rollbackInvoiceSequence: mockRollbackInvoiceSequence,
}));

function createRequest(url: string) {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      companyId: "company-1",
      clientId: "client-1",
      invoiceId: "invoice-1",
      issueDate: "2026-03-14",
      reason: "Корекция",
      currency: "EUR",
      items: [
        {
          description: "Услуга",
          quantity: 1,
          unitPrice: 100,
          taxRate: 20,
        },
      ],
    }),
  });
}

function createRequestWithoutInvoice(url: string) {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      companyId: "company-1",
      clientId: "client-1",
      issueDate: "2026-03-14",
      reason: "Корекция",
      currency: "EUR",
      items: [
        {
          description: "Услуга",
          quantity: 1,
          unitPrice: 100,
          taxRate: 20,
        },
      ],
    }),
  });
}

function createSupabaseMock(invoiceStatus: string) {
  const invoiceQuery = {
    select: vi.fn(() => invoiceQuery),
    eq: vi.fn(() => invoiceQuery),
    maybeSingle: vi.fn(async () => ({
      data: {
        id: "invoice-1",
        status: invoiceStatus,
        companyId: "company-1",
        clientId: "client-1",
        userId: "user-1",
      },
      error: null,
    })),
  };

  const insertSpy = vi.fn(() => ({
    select: () => ({
      single: async () => ({ data: null, error: null }),
    }),
  }));

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === "Invoice") return invoiceQuery;
        if (table === "CreditNote" || table === "DebitNote") {
          return { insert: insertSpy };
        }
        if (table === "CreditNoteItem" || table === "DebitNoteItem") {
          return { insert: vi.fn(async () => ({ error: null })) };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    },
    insertSpy,
  };
}

describe("credit/debit note routes", () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue({ user: { id: "session-user" } });
    mockResolveSessionUser.mockResolvedValue({ id: "user-1" });
    mockFetchOwnedCompanyAndClient.mockResolvedValue({
      company: { id: "company-1", bulstatNumber: "175074752", userId: "owner-1" },
      client: { id: "client-1" },
    });
    mockFetchProductsByIds.mockResolvedValue({});
    mockPrepareDocumentItems.mockReturnValue({
      preparedItems: [
        {
          description: "Услуга",
          quantity: 1,
          unitPrice: 100,
          unit: "бр.",
          taxRate: 20,
          subtotal: 100,
          taxAmount: 20,
          total: 120,
        },
      ],
      subtotal: 100,
      taxAmount: 20,
      total: 120,
    });
    mockCreateDocumentSnapshots.mockReturnValue({
      sellerSnapshot: {},
      buyerSnapshot: {},
      itemsSnapshot: [],
    });
    mockGetNextInvoiceSequence.mockResolvedValue({
      invoiceNumber: "2612340000000002",
      sequence: 2,
    });
    mockRollbackInvoiceSequence.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("blocks credit notes for draft invoices", async () => {
    const { supabase, insertSpy } = createSupabaseMock("DRAFT");
    mockCreateAdminClient.mockReturnValue(supabase);

    const { POST } = await import("@/app/api/credit-notes/route");
    const response = await POST(createRequest("/api/credit-notes"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/само по издадена фактура/i);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("requires source invoice for credit notes", async () => {
    const { supabase, insertSpy } = createSupabaseMock("ISSUED");
    mockCreateAdminClient.mockReturnValue(supabase);

    const { POST } = await import("@/app/api/credit-notes/route");
    const response = await POST(createRequestWithoutInvoice("/api/credit-notes"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(String(body.error)).toMatch(/Невалидни данни/i);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("blocks debit notes for cancelled invoices", async () => {
    const { supabase, insertSpy } = createSupabaseMock("CANCELLED");
    mockCreateAdminClient.mockReturnValue(supabase);

    const { POST } = await import("@/app/api/debit-notes/route");
    const response = await POST(createRequest("/api/debit-notes"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/само по издадена фактура/i);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("requires source invoice for debit notes", async () => {
    const { supabase, insertSpy } = createSupabaseMock("ISSUED");
    mockCreateAdminClient.mockReturnValue(supabase);

    const { POST } = await import("@/app/api/debit-notes/route");
    const response = await POST(createRequestWithoutInvoice("/api/debit-notes"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(String(body.error)).toMatch(/Невалидни данни/i);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("creates debit notes against the owner-scoped invoice data for team members", async () => {
    const { supabase, insertSpy } = createSupabaseMock("UNPAID");
    mockCreateAdminClient.mockReturnValue(supabase);
    mockGetNextInvoiceSequence.mockResolvedValue({
      invoiceNumber: "2612340000000002",
      sequence: 2,
    });

    const { POST } = await import("@/app/api/debit-notes/route");
    const response = await POST(createRequest("/api/debit-notes"));

    expect(response.status).toBe(200);
    expect(mockGetNextInvoiceSequence).toHaveBeenCalledWith(
      "owner-1",
      "company-1",
      "175074752"
    );
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "owner-1",
        companyId: "company-1",
      })
    );
  });
});
