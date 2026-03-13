import { describe, it, expect } from "vitest";
import {
  formatApiResponse,
  formatApiError,
  formatPaginationParams,
  buildQueryParams,
} from "@/lib/api-utils";
import { ApiStatusCode } from "@/types/api";

describe("formatApiResponse", () => {
  it("wraps data with success=true by default", () => {
    const result = formatApiResponse({ id: 1, name: "Test" });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 1, name: "Test" });
  });

  it("includes meta with timestamp when meta is provided", () => {
    const result = formatApiResponse([1, 2, 3], true, { page: 1, totalPages: 3 });
    expect(result.meta).toBeDefined();
    expect(result.meta!.page).toBe(1);
    expect(result.meta!.totalPages).toBe(3);
    expect(typeof result.meta!.timestamp).toBe("string");
  });

  it("omits meta when not provided", () => {
    const result = formatApiResponse("hello");
    expect(result.meta).toBeUndefined();
  });

  it("sets success=false when passed", () => {
    const result = formatApiResponse(null, false);
    expect(result.success).toBe(false);
  });

  it("handles array data", () => {
    const data = [{ id: 1 }, { id: 2 }];
    const result = formatApiResponse(data);
    expect(result.data).toEqual(data);
  });
});

describe("formatApiError", () => {
  it("returns error structure with success=false", () => {
    const result = formatApiError("NOT_FOUND", "Resource not found");
    expect(result.success).toBe(false);
    expect(result.error.code).toBe("NOT_FOUND");
    expect(result.error.message).toBe("Resource not found");
  });

  it("includes details when provided", () => {
    const result = formatApiError("VALIDATION_ERROR", "Bad input", { field: "email" });
    expect(result.error.details).toEqual({ field: "email" });
  });

  it("omits details when not provided", () => {
    const result = formatApiError("ERR", "msg");
    expect(result.error.details).toBeUndefined();
  });
});

describe("formatPaginationParams", () => {
  it("uses defaults for empty params", () => {
    const result = formatPaginationParams({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.sortBy).toBe("createdAt");
    expect(result.sortOrder).toBe("desc");
  });

  it("respects provided values", () => {
    const result = formatPaginationParams({ page: 3, pageSize: 25, sortBy: "name", sortOrder: "asc" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(25);
    expect(result.sortBy).toBe("name");
    expect(result.sortOrder).toBe("asc");
  });

  it("clamps page to minimum 1", () => {
    expect(formatPaginationParams({ page: 0 }).page).toBe(1);
    expect(formatPaginationParams({ page: -5 }).page).toBe(1);
  });

  it("clamps pageSize to minimum 1 for negative values", () => {
    // 0 is falsy so the || 10 default kicks in, giving 10 not 1
    expect(formatPaginationParams({ pageSize: 0 }).pageSize).toBe(10);
    // -10 is truthy so Math.max(1, -10) = 1
    expect(formatPaginationParams({ pageSize: -10 }).pageSize).toBe(1);
  });

  it("clamps pageSize to maximum 100", () => {
    expect(formatPaginationParams({ pageSize: 200 }).pageSize).toBe(100);
    expect(formatPaginationParams({ pageSize: 999 }).pageSize).toBe(100);
  });
});

describe("buildQueryParams", () => {
  it("returns empty params for no arguments", () => {
    const params = buildQueryParams();
    expect(params.toString()).toBe("");
  });

  it("includes pagination params", () => {
    const params = buildQueryParams({ page: 2, pageSize: 20 });
    expect(params.get("page")).toBe("2");
    expect(params.get("pageSize")).toBe("20");
  });

  it("includes filter params", () => {
    const params = buildQueryParams(undefined, { status: "UNPAID", clientId: "abc" });
    expect(params.get("status")).toBe("UNPAID");
    expect(params.get("clientId")).toBe("abc");
  });

  it("includes array filter values as repeated params", () => {
    const params = buildQueryParams(undefined, { tags: ["a", "b", "c"] });
    expect(params.getAll("tags")).toEqual(["a", "b", "c"]);
  });

  it("skips null/undefined filter values", () => {
    const params = buildQueryParams(undefined, { status: undefined, name: null as any });
    expect(params.toString()).toBe("");
  });

  it("includes both pagination and filters together", () => {
    const params = buildQueryParams({ page: 1, pageSize: 10 }, { status: "PAID" });
    expect(params.get("page")).toBe("1");
    expect(params.get("status")).toBe("PAID");
  });
});
