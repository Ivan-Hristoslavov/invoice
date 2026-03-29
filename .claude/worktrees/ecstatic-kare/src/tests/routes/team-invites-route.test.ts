import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockResolveSessionUser = vi.fn();
const mockCheckSubscriptionLimits = vi.fn();
const mockCanManageCompanyTeam = vi.fn();
const mockCreateTeamInviteExpiryDate = vi.fn();
const mockCreateTeamInviteToken = vi.fn();
const mockGetCompanyRoleForUser = vi.fn();
const mockGetTeamMembersForCompany = vi.fn();
const mockNormalizeTeamInviteEmail = vi.fn((email: string) => email.trim().toLowerCase());
const mockRandomUUID = vi.fn();
const mockCreateMagicLinkToken = vi.fn();
const mockSendTeamInviteEmail = vi.fn();

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

vi.mock("@/lib/team", () => ({
  TEAM_ROLES: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "VIEWER"],
  canManageCompanyTeam: mockCanManageCompanyTeam,
  createTeamInviteExpiryDate: mockCreateTeamInviteExpiryDate,
  createTeamInviteToken: mockCreateTeamInviteToken,
  getCompanyRoleForUser: mockGetCompanyRoleForUser,
  getTeamMembersForCompany: mockGetTeamMembersForCompany,
  normalizeTeamInviteEmail: mockNormalizeTeamInviteEmail,
}));

vi.mock("crypto", () => ({
  default: {
    randomUUID: mockRandomUUID,
  },
}));

vi.mock("@/lib/magic-link", () => ({
  createMagicLinkToken: mockCreateMagicLinkToken,
}));

vi.mock("@/lib/email", () => ({
  sendTeamInviteEmail: mockSendTeamInviteEmail,
}));

const mockSupabaseFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: mockSupabaseFrom,
  },
}));

function createInviteRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/team/invites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createAcceptRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/team/invites/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("team invite routes", () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue({ user: { id: "session-user" } });
    mockResolveSessionUser.mockResolvedValue({
      id: "member-user",
      email: "member@example.com",
      name: "Member User",
    });
    mockCheckSubscriptionLimits.mockResolvedValue({ allowed: true });
    mockCanManageCompanyTeam.mockReturnValue(true);
    mockCreateTeamInviteExpiryDate.mockReturnValue("2026-03-21T12:00:00.000Z");
    mockCreateTeamInviteToken.mockReturnValue("invite-token");
    mockGetCompanyRoleForUser.mockResolvedValue("OWNER");
    mockGetTeamMembersForCompany.mockResolvedValue([]);
    mockRandomUUID.mockReturnValue("invite-id");
    mockCreateMagicLinkToken.mockResolvedValue({
      token: "magic-token",
      email: "new.user@example.com",
      expires: "2026-03-15T12:00:00.000Z",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates normalized team invites for the selected company", async () => {
    const inviteInsert = vi.fn(() => ({
      select: () => ({
        single: async () => ({
          data: {
            id: "invite-id",
            companyId: "company-1",
            email: "new.user@example.com",
            role: "MANAGER",
            token: "invite-token",
          },
          error: null,
        }),
      }),
    }));

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "Company") {
        const query = {
          select: vi.fn(() => query),
          eq: vi.fn(() => query),
          maybeSingle: vi.fn(async () => ({
            data: { id: "company-1", name: "Acme", userId: "owner-1" },
            error: null,
          })),
        };

        return query;
      }

      if (table === "TeamInvite") {
        const query = {
          select: vi.fn(() => query),
          eq: vi.fn(() => query),
          gte: vi.fn(() => query),
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          insert: inviteInsert,
        };

        return query;
      }

      if (table === "User") {
        const query = {
          select: vi.fn(() => query),
          ilike: vi.fn(() => query),
          maybeSingle: vi.fn(async () => ({
            data: { id: "invited-user" },
            error: null,
          })),
        };

        return query;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { POST } = await import("@/app/api/team/invites/route");
    const response = await POST(
      createInviteRequest({
        companyId: "company-1",
        email: "New.User@Example.com",
        role: "MANAGER",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockCheckSubscriptionLimits).toHaveBeenCalledWith("owner-1", "users");
    expect(inviteInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "invite-id",
        companyId: "company-1",
        email: "new.user@example.com",
        invitedByUserId: "member-user",
        invitedUserId: "invited-user",
        role: "MANAGER",
        token: "invite-token",
      })
    );
    expect(body.inviteUrl).toBe("http://localhost/team/accept?token=invite-token");
    expect(body.magicLinkUrl).toContain("magicToken=magic-token");
    expect(mockSendTeamInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "new.user@example.com",
        companyName: "Acme",
        roleLabel: "Мениджър",
      })
    );
  });

  it("accepts a pending invite and creates company membership", async () => {
    const membershipInsert = vi.fn(async () => ({ error: null }));
    const inviteUpdateEq = vi.fn(async () => ({ error: null }));

    mockResolveSessionUser.mockResolvedValue({
      id: "accepted-user",
      email: "member@example.com",
    });
    mockRandomUUID.mockReturnValue("membership-id");

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "TeamInvite") {
        const query = {
          select: vi.fn(() => query),
          eq: vi.fn((column: string) => {
            if (column === "token") return query;

            return {
              then: undefined,
            };
          }),
          maybeSingle: vi.fn(async () => ({
            data: {
              id: "invite-1",
              companyId: "company-1",
              email: "member@example.com",
              role: "ACCOUNTANT",
              status: "PENDING",
              expiresAt: "2099-03-21T12:00:00.000Z",
            },
            error: null,
          })),
          update: vi.fn(() => ({
            eq: inviteUpdateEq,
          })),
        };

        return query;
      }

      if (table === "UserRole") {
        const query = {
          select: vi.fn(() => query),
          eq: vi.fn(() => query),
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          insert: membershipInsert,
        };

        return query;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { POST } = await import("@/app/api/team/invites/accept/route");
    const response = await POST(createAcceptRequest({ token: "invite-token" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(membershipInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "membership-id",
        userId: "accepted-user",
        companyId: "company-1",
        role: "ACCOUNTANT",
      })
    );
    expect(inviteUpdateEq).toHaveBeenCalledWith("id", "invite-1");
    expect(body.success).toBe(true);
  });
});
