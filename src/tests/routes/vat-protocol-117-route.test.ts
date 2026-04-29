import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockResolveSessionUser = vi.fn();
const mockCreateAdminClient = vi.fn();
const mockFetchOwnedCompanyAndClient = vi.fn();
const mockFetchProductsByIds = vi.fn();
const mockPrepareDocumentItems = vi.fn();
const mockCreateDocumentSnapshots = vi.fn();
const mockGetNextDocumentNumber = vi.fn();

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

vi.mock("@/lib/document-numbering", () => ({
  getNextDocumentNumber: mockGetNextDocumentNumber,
}));

function createBody(overrides: Record<string, unknown> = {}) {
  return {
    companyId: "company-1",
    clientId: "client-1",
    issueDate: "2026-04-10",
    taxEventDate: "2026-04-08",
    scenario: "INTRA_COMMUNITY_GOODS",
    currency: "EUR",
    items: [
      {
        description: "Стока ВОП",
        quantity: 1,
        unitPrice: 100,
        taxRate: 20,
      },
    ],
    ...overrides,
  };
}

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/vat-protocols-117", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/vat-protocols-117", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { email: "a@b.c" } });
    mockResolveSessionUser.mockResolvedValue({ id: "user-1" });
    mockFetchOwnedCompanyAndClient.mockResolvedValue({
      company: { id: "company-1", userId: "user-1", bulstatNumber: "123456789" },
      client: { id: "client-1" },
    });
    mockFetchProductsByIds.mockResolvedValue(new Map());
    mockPrepareDocumentItems.mockReturnValue({
      preparedItems: [
        {
          description: "Стока ВОП",
          quantity: 1,
          unitPrice: 100,
          taxRate: 20,
          unit: "бр.",
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
    mockGetNextDocumentNumber.mockResolvedValue("2612340000000001");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/vat-protocols-117/route");
    const res = await POST(createRequest(createBody()));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid scenario", async () => {
    const insertSpy = vi.fn(() => ({
      select: () => ({
        single: async () => ({ data: {}, error: null }),
      }),
    }));
    const userQuery = {
      select: vi.fn(() => userQuery),
      eq: vi.fn(() => userQuery),
      maybeSingle: vi.fn(async () => ({ data: { invoicePreferences: {} }, error: null })),
    };
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "User") return userQuery;
        if (table === "VatProtocol117") return { insert: insertSpy };
        if (table === "VatProtocol117Item") return { insert: vi.fn(async () => ({ error: null })) };
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const { POST } = await import("@/app/api/vat-protocols-117/route");
    const res = await POST(createRequest(createBody({ scenario: "INVALID" })));
    expect(res.status).toBe(400);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("creates protocol and items on success", async () => {
    const insertProtocol = vi.fn(() => ({
      select: () => ({
        single: async () => ({ data: { id: "p1" }, error: null }),
      }),
    }));
    const insertItems = vi.fn(async () => ({ error: null }));
    const userQuery = {
      select: vi.fn(() => userQuery),
      eq: vi.fn(() => userQuery),
      maybeSingle: vi.fn(async () => ({
        data: { invoicePreferences: { startingVatProtocolNumber: 42 } },
        error: null,
      })),
    };

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "User") return userQuery;
        if (table === "VatProtocol117") return { insert: insertProtocol };
        if (table === "VatProtocol117Item") return { insert: insertItems };
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const { POST } = await import("@/app/api/vat-protocols-117/route");
    const res = await POST(createRequest(createBody()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.vatProtocol117.protocolNumber).toBe("2612340000000001");
    expect(mockGetNextDocumentNumber).toHaveBeenCalledWith(
      expect.objectContaining({
        startingNumber: 42,
      })
    );
    expect(insertProtocol).toHaveBeenCalled();
    expect(insertItems).toHaveBeenCalled();
  });
});
