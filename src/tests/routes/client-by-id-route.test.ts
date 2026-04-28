import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockResolveSessionUser = vi.fn();
const mockCreateAdminClient = vi.fn();
const mockGetAccessibleOwnerUserIdsForUser = vi.fn();

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

vi.mock("@/lib/team", () => ({
  getAccessibleOwnerUserIdsForUser: mockGetAccessibleOwnerUserIdsForUser,
}));

function createPutRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/clients/client_1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createUpdateSupabaseMock() {
  const selectExistingChain = {
    eq: vi.fn(() => selectExistingChain),
    in: vi.fn(() => selectExistingChain),
    single: vi.fn(async () => ({ data: { id: "client_1" }, error: null })),
  };

  const updateChain = {
    eq: vi.fn(() => updateChain),
    in: vi.fn(() => updateChain),
    select: vi.fn(() => ({
      single: async () => ({ data: { id: "client_1", name: "Нов клиент" }, error: null }),
    })),
  };

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => selectExistingChain),
      update: vi.fn(() => updateChain),
    })),
  };
}

function createDuplicateEikSupabaseMock() {
  const selectExistingChain = {
    eq: vi.fn(() => selectExistingChain),
    in: vi.fn(() => selectExistingChain),
    single: vi.fn(async () => ({ data: { id: "client_1" }, error: null })),
  };

  const updateChain = {
    eq: vi.fn(() => updateChain),
    in: vi.fn(() => updateChain),
    select: vi.fn(() => ({
      single: async () => ({
        data: null,
        error: {
          code: "23505",
          message: 'duplicate key value violates unique constraint "Client_userId_bulstat_active_key"',
          details: 'Key ("userId", "bulstatNumber")=(user_1, 123123123) already exists.',
        },
      }),
    })),
  };

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => selectExistingChain),
      update: vi.fn(() => updateChain),
    })),
  };
}

describe("PUT /api/clients/[id] route", () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue({ user: { id: "session-user" } });
    mockResolveSessionUser.mockResolvedValue({ id: "user_1" });
    mockGetAccessibleOwnerUserIdsForUser.mockResolvedValue(["user_1"]);
    mockCreateAdminClient.mockReturnValue(createUpdateSupabaseMock());
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("updates accessible client without explicit client:update permission gate", async () => {
    const { PUT } = await import("@/app/api/clients/[id]/route");
    const response = await PUT(
      createPutRequest({
        name: "Нов клиент",
        email: "client@example.com",
        address: "ул. Пример 1",
        city: "София",
        country: "България",
        bulstatNumber: "175074752",
        vatRegistered: true,
        vatRegistrationNumber: "BG175074752",
      }),
      { params: Promise.resolve({ id: "client_1" }) }
    );

    expect(response.status).toBe(200);
  });

  it("returns 409 for duplicate active EIK on update", async () => {
    mockCreateAdminClient.mockReturnValue(createDuplicateEikSupabaseMock());
    const { PUT } = await import("@/app/api/clients/[id]/route");

    const response = await PUT(
      createPutRequest({
        name: "Клиент с дублиран ЕИК",
        email: "client2@example.com",
        address: "ул. Пример 2",
        city: "София",
        country: "България",
        bulstatNumber: "123123123",
        vatRegistered: false,
      }),
      { params: Promise.resolve({ id: "client_1" }) }
    );

    const body = await response.json();
    expect(response.status).toBe(409);
    expect(String(body.error || "")).toContain("ЕИК/БУЛСТАТ");
  });
});
