import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mimeTypeToJspdfFormat,
  embedCompanyLogoInPdf,
  fitLogoDimensionsToBox,
} from "@/lib/pdf-company-logo";

describe("fitLogoDimensionsToBox", () => {
  it("fits a wide image to width", () => {
    expect(fitLogoDimensionsToBox(300, 100, 30, 20)).toEqual({
      drawW: 30,
      drawH: 10,
    });
  });

  it("fits a tall image to height", () => {
    expect(fitLogoDimensionsToBox(100, 200, 30, 20)).toEqual({
      drawW: 10,
      drawH: 20,
    });
  });
});

describe("mimeTypeToJspdfFormat", () => {
  it("maps common image types", () => {
    expect(mimeTypeToJspdfFormat("image/png")).toBe("PNG");
    expect(mimeTypeToJspdfFormat("image/jpeg")).toBe("JPEG");
    expect(mimeTypeToJspdfFormat("image/jpg")).toBe("JPEG");
    expect(mimeTypeToJspdfFormat("image/webp")).toBe("WEBP");
    expect(mimeTypeToJspdfFormat("image/gif")).toBe("GIF");
  });

  it("returns null for svg", () => {
    expect(mimeTypeToJspdfFormat("image/svg+xml")).toBeNull();
  });
});

describe("embedCompanyLogoInPdf", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it("skips svg by URL extension without fetching", async () => {
    const addImage = vi.fn();
    const doc = { addImage } as unknown as import("jspdf").default;
    const h = await embedCompanyLogoInPdf(
      doc,
      "https://cdn.example/bucket/logo.svg",
      { x: 0, y: 0, maxW: 10, maxH: 10 },
      "test"
    );
    expect(h).toBe(0);
    expect(addImage).not.toHaveBeenCalled();
  });

  it("returns 0 when fetch is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    }) as unknown as typeof fetch;

    const addImage = vi.fn();
    const doc = { addImage } as unknown as import("jspdf").default;
    const h = await embedCompanyLogoInPdf(
      doc,
      "https://cdn.example/logo.png",
      { x: 0, y: 0, maxW: 10, maxH: 10 },
      "test"
    );
    expect(h).toBe(0);
    expect(addImage).not.toHaveBeenCalled();
  });

  it("embeds png when fetch succeeds", async () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const body = new Uint8Array([...pngHeader, ...new Uint8Array(8).fill(0)]);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => body.buffer,
      headers: {
        get: (name: string) => (name.toLowerCase() === "content-type" ? "image/png" : null),
      },
    }) as unknown as typeof fetch;

    const addImage = vi.fn();
    const getImageProperties = vi.fn().mockReturnValue({
      width: 300,
      height: 100,
    });
    const doc = { addImage, getImageProperties } as unknown as import("jspdf").default;
    const h = await embedCompanyLogoInPdf(
      doc,
      "https://cdn.example/logo.png",
      { x: 1, y: 2, maxW: 30, maxH: 20 },
      "test"
    );
    expect(h).toBe(10);
    expect(addImage).toHaveBeenCalledTimes(1);
    expect(addImage.mock.calls[0][1]).toBe("PNG");
    expect(addImage.mock.calls[0].slice(2)).toEqual([1, 2, 30, 10]);
  });
});
