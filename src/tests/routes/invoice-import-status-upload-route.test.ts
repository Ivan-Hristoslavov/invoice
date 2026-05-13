import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  resolveSessionUser: vi.fn(),
  createAdminClient: vi.fn(),
  logAction: vi.fn(),
}));

vi.mock("iconv-lite", () => ({
  __esModule: true,
  default: {
    decode: (buf: Buffer) => buf.toString("utf8"),
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/session-user", () => ({
  resolveSessionUser: mocks.resolveSessionUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/audit-log", () => ({
  logAction: mocks.logAction,
}));

import { POST } from "@/app/api/invoices/import-status-upload/route";

function makeMultipartRequest(
  parts: Array<{
    name: string;
    value?: string;
    filename?: string;
    fileContent?: string;
    contentType?: string;
  }>
) {
  const boundary = "----VitestImportBoundary";
  const chunks: string[] = [];
  for (const p of parts) {
    chunks.push(`--${boundary}`);
    if (p.filename != null && p.fileContent != null) {
      chunks.push(
        `Content-Disposition: form-data; name="${p.name}"; filename="${p.filename.replace(/"/g, "")}"`
      );
      chunks.push(`Content-Type: ${p.contentType ?? "text/plain"}`);
      chunks.push("");
      chunks.push(p.fileContent);
    } else if (p.value != null) {
      chunks.push(`Content-Disposition: form-data; name="${p.name}"`);
      chunks.push("");
      chunks.push(p.value);
    }
  }
  chunks.push(`--${boundary}--`);
  chunks.push("");
  const body = chunks.join("\r\n");
  return new NextRequest("http://localhost/api/invoices/import-status-upload", {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body,
  });
}

function supabaseMocksForSuccessfulUpdate() {
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
  mocks.createAdminClient.mockReturnValue({
    from: vi.fn(() => ({
      select,
      update,
    })),
  });
}

describe("POST /api/invoices/import-status-upload", () => {
  beforeEach(() => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "session-user" } });
    mocks.resolveSessionUser.mockResolvedValue({ id: "user-1" });
    mocks.logAction.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when format is invalid", async () => {
    const res = await POST(
      makeMultipartRequest([
        { name: "format", value: "nope" },
        { name: "file", filename: "f.csv", fileContent: "x", contentType: "text/plain" },
      ])
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when file is missing", async () => {
    const fd = new FormData();
    fd.set("format", "csv_status");
    const res = await POST(
      new NextRequest("http://localhost/api/invoices/import-status-upload", {
        method: "POST",
        body: fd,
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for unrecognized microinvest txt", async () => {
    const res = await POST(
      makeMultipartRequest([
        { name: "format", value: "microinvest_txt" },
        { name: "defaultCompanyId", value: "company-1" },
        {
          name: "file",
          filename: "x.txt",
          fileContent: "not microinvest content",
          contentType: "text/plain",
        },
      ])
    );
    expect(res.status).toBe(400);
  });

  it("parses Microinvest XML upload and applies status import", async () => {
    supabaseMocksForSuccessfulUpdate();
    const xml = "<ExportData><InvoiceNo>260000000001</InvoiceNo></ExportData>";
    const res = await POST(
      makeMultipartRequest([
        { name: "format", value: "microinvest_xml" },
        { name: "defaultCompanyId", value: "company-1" },
        { name: "file", filename: "export.xml", fileContent: xml, contentType: "application/xml" },
      ])
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.appliedCount).toBe(1);
    expect(body.applied[0]?.status).toBe("UNPAID");
    expect(mocks.logAction).toHaveBeenCalled();
  });
});
