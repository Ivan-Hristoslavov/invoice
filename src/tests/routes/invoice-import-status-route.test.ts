import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockResolveSessionUser = vi.fn();
const mockCreateAdminClient = vi.fn();
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

vi.mock("@/lib/audit-log", () => ({
  logAction: mockLogAction,
}));

function createRequest(payload: unknown) {
  return new NextRequest("http://localhost/api/invoices/import-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/invoices/import-status", () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue({ user: { id: "session-user" } });
    mockResolveSessionUser.mockResolvedValue({ id: "user-1" });
    mockLogAction.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("updates invoice status from ISSUED to UNPAID through import", async () => {
    const update = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(async () => ({ error: null })),
      })),
    }));
    const queryLevel3 = {
      maybeSingle: async () => ({
        data: {
          id: "inv-1",
          status: "UNPAID",
          invoiceNumber: "260000000001",
          cancelledAt: null,
        },
        error: null,
      }),
    };
    const queryLevel2 = { eq: vi.fn(() => queryLevel3) };
    const queryLevel1 = { eq: vi.fn(() => queryLevel2) };
    const select = vi.fn(() => ({ eq: vi.fn(() => queryLevel1) }));

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select,
        update,
      })),
    });

    const { POST } = await import("@/app/api/invoices/import-status/route");
    const response = await POST(
      createRequest({
        rows: [
          {
            invoiceNumber: "260000000001",
            companyId: "company-1",
            status: "ISSUED",
          },
        ],
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.appliedCount).toBe(1);
    expect(body.applied[0]?.status).toBe("UNPAID");
    expect(mockLogAction).toHaveBeenCalled();
  });
});
