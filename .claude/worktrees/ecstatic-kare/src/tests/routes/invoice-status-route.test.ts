import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockResolveSessionUser = vi.fn();
const mockCreateAdminClient = vi.fn();
const mockRevalidatePath = vi.fn();

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

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

function createRequest(status: string) {
  return new NextRequest("http://localhost/api/invoices/invoice-1/status", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

function createSupabaseMock(currentStatus: string) {
  const selectQuery = {
    eq: vi.fn(() => selectQuery),
    single: vi.fn(async () => ({
      data: {
        id: "invoice-1",
        status: currentStatus,
        userId: "user-1",
      },
      error: null,
    })),
  };

  const update = vi.fn(() => ({
    eq: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: { id: "invoice-1", status: "ISSUED" },
          error: null,
        })),
      })),
    })),
  }));

  return {
    client: {
      from: vi.fn(() => ({
        select: vi.fn(() => selectQuery),
        update,
      })),
    },
    update,
  };
}

describe("PATCH /api/invoices/[id]/status", () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue({ user: { id: "session-user" } });
    mockResolveSessionUser.mockResolvedValue({ id: "user-1" });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("rejects direct cancellation of issued invoices", async () => {
    const { client, update } = createSupabaseMock("ISSUED");
    mockCreateAdminClient.mockReturnValue(client);

    const { PATCH } = await import("@/app/api/invoices/[id]/status/route");
    const response = await PATCH(createRequest("CANCELLED"), {
      params: Promise.resolve({ id: "invoice-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/не може да се промени статуса/i);
    expect(update).not.toHaveBeenCalled();
  });
});
