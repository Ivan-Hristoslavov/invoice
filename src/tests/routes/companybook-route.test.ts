import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockResolveSessionUser = vi.fn();
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

vi.mock("@/middleware/subscription", () => ({
  checkSubscriptionLimits: mockCheckSubscriptionLimits,
}));

describe("CompanyBook proxy routes", () => {
  beforeEach(() => {
    vi.stubEnv("COMPANYBOOK_API_KEY", "test-key");
    vi.stubEnv("COMPANYBOOK_API_BASE", "https://api.companybook.bg/api");
    mockGetServerSession.mockResolvedValue({ user: { id: "session-user" } });
    mockResolveSessionUser.mockResolvedValue({ id: "user_1" });
    mockCheckSubscriptionLimits.mockResolvedValue({ allowed: true });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const { GET } = await import("@/app/api/companybook/companies/search/route");

    const response = await GET(
      new NextRequest("http://localhost/api/companybook/companies/search?name=alfa")
    );
    expect(response).toBeDefined();
    expect(response!.status).toBe(401);
  });

  it("loads company by uic through X-API-Key proxy", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ company: { uic: "175074752" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { GET } = await import("@/app/api/companybook/companies/[uic]/route");
    const response = await GET(
      new NextRequest("http://localhost/api/companybook/companies/175074752?with_data=true"),
      { params: Promise.resolve({ uic: "175074752" }) }
    );
    expect(response).toBeDefined();
    const body = await response!.json();

    expect(response!.status).toBe(200);
    expect(body.company.uic).toBe("175074752");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("/companies/175074752?with_data=true"),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-API-Key": "test-key",
        }),
      })
    );
  });

  it("returns 429 when upstream rate limit is hit", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "rate limited" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { GET } = await import("@/app/api/companybook/shared/search/route");
    const response = await GET(
      new NextRequest("http://localhost/api/companybook/shared/search?name=pet&limit=3")
    );
    expect(response).toBeDefined();
    const body = await response!.json();

    expect(response!.status).toBe(429);
    expect(String(body.error)).toMatch(/лимит/i);
  });
});
