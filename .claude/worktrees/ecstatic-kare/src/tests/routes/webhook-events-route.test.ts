import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetServerSession = vi.fn();
const mockResolveSessionUser = vi.fn();
const mockCreateAdminClient = vi.fn();

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

function createWebhookEventsSupabaseMock() {
  const query = {
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    eq: vi.fn(() => query),
    data: [{ id: "evt-log-1", eventId: "evt_123", status: "SUCCESS" }],
    error: null,
  } as unknown as {
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    data: Array<{ id: string; eventId: string; status: string }>;
    error: null;
  };

  return {
    client: {
      from: vi.fn(() => ({
        select: vi.fn(() => query),
      })),
    },
  };
}

describe("GET /api/webhooks/events", () => {
  const originalAllowlist = process.env.WEBHOOK_EVENTS_ADMIN_EMAILS;

  beforeEach(() => {
    process.env.WEBHOOK_EVENTS_ADMIN_EMAILS = "admin@example.com";
    mockGetServerSession.mockResolvedValue({
      user: { email: "member@example.com" },
    });
    mockResolveSessionUser.mockResolvedValue({
      id: "user-1",
      email: "member@example.com",
    });
  });

  afterEach(() => {
    process.env.WEBHOOK_EVENTS_ADMIN_EMAILS = originalAllowlist;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("rejects authenticated users outside the admin allowlist", async () => {
    const { GET } = await import("@/app/api/webhooks/events/route");

    const response = await GET(new Request("http://localhost/api/webhooks/events"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden");
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });

  it("returns webhook events for allowlisted admins", async () => {
    const { client } = createWebhookEventsSupabaseMock();
    mockCreateAdminClient.mockReturnValue(client);
    mockGetServerSession.mockResolvedValue({
      user: { email: "admin@example.com" },
    });
    mockResolveSessionUser.mockResolvedValue({
      id: "user-1",
      email: "admin@example.com",
    });

    const { GET } = await import("@/app/api/webhooks/events/route");
    const response = await GET(
      new Request("http://localhost/api/webhooks/events?limit=10&status=SUCCESS")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(1);
    expect(body.events[0].eventId).toBe("evt_123");
  });
});
