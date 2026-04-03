import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/team", () => ({
  getAccessibleCompaniesForUser: vi.fn(async () => []),
  getAccessibleOwnerUserIdsForUser: vi.fn(async () => []),
}));

import {
  createDocumentSnapshots,
  prepareDocumentItems,
} from "@/lib/invoice-documents";

describe("invoice-documents", () => {
  it("adds product units and recalculates totals from source fields", () => {
    const productById = new Map([
      [
        "prod-1",
        {
          id: "prod-1",
          unit: "час",
          taxRate: 20,
        },
      ],
    ]);

    const { preparedItems, subtotal, taxAmount, total } = prepareDocumentItems(
      [
        {
          description: "Консултация",
          quantity: 2,
          price: 50,
          productId: "prod-1",
        },
      ],
      productById
    );

    expect(preparedItems[0].unit).toBe("час");
    expect(preparedItems[0].taxRate).toBe(20);
    expect(subtotal).toBe(100);
    expect(taxAmount).toBe(20);
    expect(total).toBe(120);
  });

  it("creates immutable seller, buyer, and items snapshots", () => {
    const productById = new Map<string, Record<string, unknown>>();
    const preparedItems = [
      {
        description: "Услуга",
        quantity: 1,
        unitPrice: 100,
        unit: "бр.",
        taxRate: 20,
        subtotal: 100,
        taxAmount: 20,
        total: 120,
      },
    ];

    const snapshots = createDocumentSnapshots(
      {
        id: "company-1",
        name: "Моята Фирма",
        bulstatNumber: "175074752",
        bankIban: "BG11AAAA00000000000000",
      },
      {
        id: "client-1",
        name: "Клиент",
        city: "София",
      },
      preparedItems,
      productById
    );

    expect(snapshots.sellerSnapshot).toMatchObject({
      id: "company-1",
      name: "Моята Фирма",
      bulstatNumber: "175074752",
    });
    expect(snapshots.buyerSnapshot).toMatchObject({
      id: "client-1",
      name: "Клиент",
    });
    expect(snapshots.itemsSnapshot).toEqual([
      expect.objectContaining({
        description: "Услуга",
        unit: "бр.",
      }),
    ]);
  });
});
