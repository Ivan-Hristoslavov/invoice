import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockResolveSessionUser = vi.fn();
const mockCheckSubscriptionLimits = vi.fn();
const mockCreateAdminClient = vi.fn();
const mockSendCreditNoteEmail = vi.fn();
const mockLogAction = vi.fn();
const mockGenerateCreditNotePdfServer = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/session-user", () => ({
  resolveSessionUser: mockResolveSessionUser,
}));

vi.mock("@/middleware/subscription", () => ({
  checkSubscriptionLimits: mockCheckSubscriptionLimits,
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("@/lib/email", () => ({
  sendCreditNoteEmail: mockSendCreditNoteEmail,
}));

vi.mock("@/lib/audit-log", () => ({
  logAction: mockLogAction,
}));

vi.mock("@/lib/credit-note-pdf", () => ({
  generateCreditNotePdfServer: mockGenerateCreditNotePdfServer,
}));

function createRequest() {
  return new NextRequest("http://localhost/api/credit-notes/cn-1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify({}),
  });
}

interface SupabaseFixture {
  creditNote?: Record<string, unknown> | null;
  creditNoteError?: { message: string } | null;
  invoice?: Record<string, unknown> | null;
  client?: Record<string, unknown> | null;
  company?: Record<string, unknown> | null;
}

function createSupabaseMock(fixture: SupabaseFixture) {
  const creditNoteSingle = vi.fn(async () => ({
    data: fixture.creditNote ?? null,
    error: fixture.creditNoteError ?? null,
  }));

  const creditNoteQuery = {
    select: vi.fn(() => creditNoteQuery),
    eq: vi.fn(() => creditNoteQuery),
    single: creditNoteSingle,
  };

  const buildRelatedQuery = (data: unknown) => {
    const query: Record<string, unknown> = {};
    query.select = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.maybeSingle = vi.fn(async () => ({ data, error: null }));
    return query;
  };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "CreditNote") return creditNoteQuery;
      if (table === "Invoice") return buildRelatedQuery(fixture.invoice ?? null);
      if (table === "Client") return buildRelatedQuery(fixture.client ?? null);
      if (table === "Company") return buildRelatedQuery(fixture.company ?? null);
      throw new Error(`Unexpected table ${table}`);
    }),
  };

  return supabase;
}

describe("POST /api/credit-notes/[id]/send", () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue({ user: { id: "session-user" } });
    mockResolveSessionUser.mockResolvedValue({ id: "user-1" });
    mockCheckSubscriptionLimits.mockResolvedValue({ allowed: true });
    mockSendCreditNoteEmail.mockResolvedValue(undefined);
    mockLogAction.mockResolvedValue(undefined);
    mockGenerateCreditNotePdfServer.mockResolvedValue(Buffer.from("pdf"));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when no session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const { POST } = await import(
      "@/app/api/credit-notes/[id]/send/route"
    );
    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "cn-1" }),
    });

    expect(response.status).toBe(401);
    expect(mockSendCreditNoteEmail).not.toHaveBeenCalled();
  });

  it("returns 404 when the credit note is not found for this user", async () => {
    mockCreateAdminClient.mockReturnValue(
      createSupabaseMock({
        creditNote: null,
        creditNoteError: { message: "not found" },
      })
    );

    const { POST } = await import(
      "@/app/api/credit-notes/[id]/send/route"
    );
    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "cn-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/Кредитното известие не е намерено/i);
    expect(mockSendCreditNoteEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when the client has no email", async () => {
    mockCreateAdminClient.mockReturnValue(
      createSupabaseMock({
        creditNote: {
          id: "cn-1",
          creditNoteNumber: "0000000001",
          clientId: "client-1",
          companyId: "company-1",
          invoiceId: "invoice-1",
          items: [],
        },
        invoice: { id: "invoice-1", invoiceNumber: "2612340000000001" },
        client: { id: "client-1", name: "Клиент", email: null },
        company: { id: "company-1", name: "Фирма" },
      })
    );

    const { POST } = await import(
      "@/app/api/credit-notes/[id]/send/route"
    );
    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "cn-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/Липсва имейл/i);
    expect(mockSendCreditNoteEmail).not.toHaveBeenCalled();
    expect(mockLogAction).not.toHaveBeenCalled();
  });

  it("sends the credit note email and logs the SEND action", async () => {
    mockCreateAdminClient.mockReturnValue(
      createSupabaseMock({
        creditNote: {
          id: "cn-1",
          creditNoteNumber: "0000000001",
          clientId: "client-1",
          companyId: "company-1",
          invoiceId: "invoice-1",
          items: [],
        },
        invoice: { id: "invoice-1", invoiceNumber: "2612340000000001" },
        client: {
          id: "client-1",
          name: "Клиент",
          email: "client@example.com",
        },
        company: { id: "company-1", name: "Фирма" },
      })
    );

    const { POST } = await import(
      "@/app/api/credit-notes/[id]/send/route"
    );
    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "cn-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockGenerateCreditNotePdfServer).toHaveBeenCalledTimes(1);
    expect(mockSendCreditNoteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "client@example.com",
        creditNoteNumber: "0000000001",
        invoiceNumber: "2612340000000001",
        companyName: "Фирма",
      })
    );
    expect(mockLogAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        action: "SEND",
        entityType: "CREDIT_NOTE",
        entityId: "cn-1",
        invoiceId: "invoice-1",
      })
    );
  });
});
