import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockResolveSessionUser = vi.fn();
const mockCreateAdminClient = vi.fn();
const mockCheckSubscriptionLimits = vi.fn();

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

vi.mock("@/lib/team", () => ({
  getAccessibleOwnerUserIdsForUser: vi.fn(async () => ["user_1"]),
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/clients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createClientSupabaseMock() {
  let insertedPayload: Record<string, unknown> | null = null;

  const duplicateChain = {
    select: vi.fn(() => duplicateChain),
    in: vi.fn(() => duplicateChain),
    eq: vi.fn(() => duplicateChain),
    limit: vi.fn(() => duplicateChain),
    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
  };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table !== "Client") throw new Error(`Unexpected table ${table}`);

      return {
        select: vi.fn(() => duplicateChain),
        insert: vi.fn((payload: Record<string, unknown>) => {
          insertedPayload = payload;
          return {
            select: () => ({
              single: async () => ({
                data: payload,
                error: null,
              }),
            }),
          };
        }),
      };
    }),
  };

  return {
    supabase,
    getInsertedPayload: () => insertedPayload,
  };
}

function createClientDuplicateCheckSupabaseMock(hasDuplicate: boolean) {
  const lookup = {
    select: vi.fn(() => lookup),
    in: vi.fn(() => lookup),
    eq: vi.fn(() => lookup),
    limit: vi.fn(() => lookup),
    maybeSingle: vi.fn(async () => ({
      data: hasDuplicate ? { id: "client_existing" } : null,
      error: null,
    })),
  };

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table !== "Client") throw new Error(`Unexpected table ${table}`);
        return lookup;
      }),
    },
  };
}

describe("POST /api/clients route", () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue({ user: { id: "session-user" } });
    mockResolveSessionUser.mockResolvedValue({ id: "user_1" });
    mockCheckSubscriptionLimits.mockResolvedValue({ allowed: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns validation details for invalid Bulgarian client data", async () => {
    const { POST } = await import("@/app/api/clients/route");

    const response = await POST(
      createRequest({
        name: "Клиент ЕООД",
        address: "ул. Пример 1",
        city: "София",
        country: "България",
        bulstatNumber: "123",
        vatRegistered: true,
        vatRegistrationNumber: "123",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["bulstatNumber"],
          message: expect.stringContaining("Невалиден"),
        }),
        expect.objectContaining({
          path: ["vatRegistrationNumber"],
          message: expect.stringContaining("Невалиден"),
        }),
      ])
    );
  });

  it("creates a normalized Bulgarian client payload", async () => {
    const { supabase, getInsertedPayload } = createClientSupabaseMock();
    mockCreateAdminClient.mockReturnValue(supabase);

    const { POST } = await import("@/app/api/clients/route");

    const response = await POST(
      createRequest({
        name: "  Клиент ЕООД  ",
        email: "client@example.com",
        address: "ул. Шипка 1",
        city: "София",
        country: "България",
        bulstatNumber: "204676177",
        vatRegistered: true,
        vatRegistrationNumber: "bg204676177",
        mol: "Мария Петрова",
        uicType: "BULSTAT",
      })
    );

    const body = await response.json();
    const insertedPayload = getInsertedPayload();

    expect(response.status).toBe(201);
    expect(body.name).toBe("Клиент ЕООД");
    expect(insertedPayload).toEqual(
      expect.objectContaining({
        name: "Клиент ЕООД",
        userId: "user_1",
        bulstatNumber: "204676177",
        vatRegistrationNumber: "BG204676177",
        vatNumber: "BG204676177",
        taxComplianceSystem: "bulgarian",
      })
    );
  });

  it("allows manual client creation without strict EIK format validation", async () => {
    const { supabase, getInsertedPayload } = createClientSupabaseMock();
    mockCreateAdminClient.mockReturnValue(supabase);

    const { POST } = await import("@/app/api/clients/route");

    const response = await POST(
      createRequest({
        name: "Ръчен клиент",
        address: "ул. Пример 1",
        city: "София",
        country: "България",
        bulstatNumber: "123456789",
        entryMode: "manual",
      })
    );

    const body = await response.json();
    const insertedPayload = getInsertedPayload();

    expect(response.status).toBe(201);
    expect(body.name).toBe("Ръчен клиент");
    expect(insertedPayload).toEqual(
      expect.objectContaining({
        name: "Ръчен клиент",
        bulstatNumber: "123456789",
      })
    );
  });

  it("returns duplicate status for manual client identifier preflight checks", async () => {
    const { supabase } = createClientDuplicateCheckSupabaseMock(true);
    mockCreateAdminClient.mockReturnValue(supabase);

    const { GET } = await import("@/app/api/clients/route");
    const response = await GET(
      new NextRequest(
        "http://localhost/api/clients?bulstatNumber=123456789&uicType=BULSTAT"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.exists).toBe(true);
    expect(body.message).toMatch(/вече имате клиент/i);
  });
});
