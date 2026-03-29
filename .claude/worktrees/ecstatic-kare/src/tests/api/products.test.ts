import { describe, it, expect } from "vitest";
import { fetchApi } from "@/lib/api-utils";

describe("GET /api/products (MSW mock)", () => {
  it("returns all products as array (no pagination)", async () => {
    const result = await fetchApi<any[]>("/api/products");
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data!.length).toBeGreaterThan(0);
  });

  it("returns product with expected fields", async () => {
    const result = await fetchApi<any[]>("/api/products");
    const product = result.data![0];
    expect(product).toHaveProperty("id");
    expect(product).toHaveProperty("name");
    expect(product).toHaveProperty("price");
    expect(product).toHaveProperty("unit");
    expect(product).toHaveProperty("taxRate");
  });

  it("filters by search query", async () => {
    const result = await fetchApi<any[]>("/api/products?query=Услуга");
    expect(result.success).toBe(true);
    const names = result.data!.map((p: any) => p.name);
    expect(names.some((n: string) => n.includes("Услуга"))).toBe(true);
  });

  it("returns empty array for non-matching query", async () => {
    const result = await fetchApi<any[]>("/api/products?query=xyz-not-found");
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns paginated response with page param", async () => {
    const result = await fetchApi<any>("/api/products?page=1&pageSize=12");
    const body = result.data as any;
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
    expect(body.meta.page).toBe(1);
  });
});
