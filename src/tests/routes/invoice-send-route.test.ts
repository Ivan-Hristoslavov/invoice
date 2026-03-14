import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockResolveSessionUser = vi.fn();
const mockCheckSubscriptionLimits = vi.fn();
const mockCreateAdminClient = vi.fn();
const mockSendInvoiceEmail = vi.fn();
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

vi.mock("@/middleware/subscription", () => ({
  checkSubscriptionLimits: mockCheckSubscriptionLimits,
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("@/lib/email", () => ({
  sendInvoiceEmail: mockSendInvoiceEmail,
}));

vi.mock("@/lib/audit-log", () => ({
  logAction: mockLogAction,
}));

function createRequest() {
  return new NextRequest("http://localhost/api/invoices/invoice-1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify({ type: "invoice_only" }),
  });
}

function createSupabaseMock(invoiceStatus: string) {
  const update = vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null })),
    })),
  }));

  const selectQuery = {
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: async () => ({
          data: {
            id: "invoice-1",
            invoiceNumber: "260000000001",
            status: invoiceStatus,
            client: {
              email: "client@example.com",
            },
          },
          error: null,
        }),
      })),
    })),
  };

  return {
    update,
    client: {
      from: vi.fn(() => ({
        select: vi.fn(() => selectQuery),
        update,
      })),
    },
  };
}

describe("POST /api/invoices/[id]/send", () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue({ user: { id: "session-user" } });
    mockResolveSessionUser.mockResolvedValue({ id: "user-1" });
    mockCheckSubscriptionLimits.mockResolvedValue({ allowed: true });
    mockSendInvoiceEmail.mockResolvedValue(undefined);
    mockLogAction.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("sends a draft invoice and persists the compatible issued database status", async () => {
    const { client, update } = createSupabaseMock("DRAFT");
    mockCreateAdminClient.mockReturnValue(client);

    const { POST } = await import("@/app/api/invoices/[id]/send/route");

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "invoice-1" }),
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockSendInvoiceEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceNumber: "260000000001",
        userId: "user-1",
      })
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "PAID",
      })
    );
  });

  it("does not resend cancelled invoices", async () => {
    const { client, update } = createSupabaseMock("CANCELLED");
    mockCreateAdminClient.mockReturnValue(client);

    const { POST } = await import("@/app/api/invoices/[id]/send/route");

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "invoice-1" }),
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/анулирани|отменени/i);
    expect(mockSendInvoiceEmail).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
