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

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/companies", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createCompanySupabaseMock() {
  let insertedPayload: Record<string, unknown> | null = null;
  let companyCallCount = 0;

  const duplicateLookup = {
    select: vi.fn(() => duplicateLookup),
    ilike: vi.fn(() => duplicateLookup),
    limit: vi.fn(() => duplicateLookup),
    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
  };

  const insertBuilder = {
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

  const supabase = {
    from: vi.fn((table: string) => {
      if (table !== "Company") throw new Error(`Unexpected table ${table}`);
      companyCallCount += 1;
      return companyCallCount === 1 ? duplicateLookup : insertBuilder;
    }),
  };

  return {
    supabase,
    getInsertedPayload: () => insertedPayload,
  };
}

describe("POST /api/companies route", () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue({ user: { id: "session-user" } });
    mockResolveSessionUser.mockResolvedValue({ id: "user_1" });
    mockCheckSubscriptionLimits.mockResolvedValue({ allowed: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns validation details for invalid Bulgarian company identifiers", async () => {
    const { POST } = await import("@/app/api/companies/route");

    const response = await POST(
      createRequest({
        name: "Тест ООД",
        email: "test@example.com",
        address: "ул. Пример 1",
        city: "София",
        country: "България",
        bulstatNumber: "123",
        vatRegistered: false,
        vatRegistrationNumber: "123",
        mol: "",
        uicType: "BULSTAT",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Неуспешна валидация");
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
        expect.objectContaining({
          path: ["vatRegistered"],
          message: expect.stringContaining("ДДС"),
        }),
        expect.objectContaining({
          path: ["mol"],
          message: expect.stringContaining("МОЛ"),
        }),
      ])
    );
  });

  it("persists normalized Bulgarian company payload", async () => {
    const { supabase, getInsertedPayload } = createCompanySupabaseMock();
    mockCreateAdminClient.mockReturnValue(supabase);

    const { POST } = await import("@/app/api/companies/route");

    const response = await POST(
      createRequest({
        name: "  Тест ООД  ",
        email: "office@example.com",
        phone: "0888123456",
        address: "бул. България 1",
        city: "София",
        country: "България",
        bulstatNumber: "204676177",
        vatRegistered: true,
        vatRegistrationNumber: "bg204676177",
        mol: "Иван Иванов",
        uicType: "BULSTAT",
      })
    );

    const body = await response.json();
    const insertedPayload = getInsertedPayload();

    expect(response.status).toBe(200);
    expect(body.name).toBe("Тест ООД");
    expect(insertedPayload).toEqual(
      expect.objectContaining({
        name: "Тест ООД",
        userId: "user_1",
        bulstatNumber: "204676177",
        vatRegistered: true,
        vatRegistrationNumber: "BG204676177",
        vatNumber: "BG204676177",
        taxComplianceSystem: "bulgarian",
      })
    );
  });
});
