import { describe, it, expect } from "vitest";
import { fetchApi } from "@/lib/api-utils";

describe("GET /api/clients (MSW mock)", () => {
  it("returns all clients as an array (no pagination)", async () => {
    const result = await fetchApi<any[]>("/api/clients");
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data!.length).toBeGreaterThan(0);
  });

  it("returns first client with expected fields", async () => {
    const result = await fetchApi<any[]>("/api/clients");
    const client = result.data![0];
    expect(client).toHaveProperty("id");
    expect(client).toHaveProperty("name");
    expect(client).toHaveProperty("email");
  });

  it("filters clients by query", async () => {
    const result = await fetchApi<any[]>("/api/clients?query=Тестов");
    expect(result.success).toBe(true);
    const names = result.data!.map((c: any) => c.name);
    expect(names.some((n: string) => n.includes("Тестов"))).toBe(true);
  });

  it("returns empty array for non-matching query", async () => {
    const result = await fetchApi<any[]>("/api/clients?query=xyz-not-found");
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns paginated response when page param is provided", async () => {
    const result = await fetchApi<any>("/api/clients?page=1&pageSize=10");
    expect(result.success).toBe(true);
    // The raw response will be { data: [], meta: {} } — fetchApi wraps it in data
    const body = result.data as any;
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(10);
    expect(typeof body.meta.totalItems).toBe("number");
    expect(typeof body.meta.totalPages).toBe("number");
  });
});

describe("POST /api/clients (MSW mock)", () => {
  it("creates a client and returns it", async () => {
    const result = await fetchApi<any>("/api/clients", {
      method: "POST",
      body: JSON.stringify({ name: "Нов Клиент", email: "new@test.com" }),
    });
    expect(result.success).toBe(true);
    expect(result.data!.name).toBe("Нов Клиент");
  });
});
