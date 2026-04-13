import { describe, expect, it } from "vitest";
import { createGoodsRecipientSnapshot } from "@/lib/document-snapshots";

describe("document-snapshots", () => {
  it("createGoodsRecipientSnapshot returns null when empty", () => {
    expect(createGoodsRecipientSnapshot(null)).toBeNull();
    expect(createGoodsRecipientSnapshot(undefined)).toBeNull();
    expect(createGoodsRecipientSnapshot({})).toBeNull();
    expect(createGoodsRecipientSnapshot({ name: "", phone: "", mol: "" })).toBeNull();
  });

  it("createGoodsRecipientSnapshot keeps buyer MOL independent from goods recipient MOL", () => {
    const snap = createGoodsRecipientSnapshot({
      name: "Иван Иванов",
      phone: "0888123456",
      mol: "Петър Петров",
    });
    expect(snap).toEqual({
      name: "Иван Иванов",
      phone: "0888123456",
      mol: "Петър Петров",
    });
  });
});
