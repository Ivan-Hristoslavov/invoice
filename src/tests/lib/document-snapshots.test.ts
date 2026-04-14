import { describe, expect, it } from "vitest";
import {
  createGoodsRecipientSnapshot,
  withDocumentSnapshots,
} from "@/lib/document-snapshots";

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

  it("withDocumentSnapshots fills logo from live company when snapshot omits it", () => {
    const merged = withDocumentSnapshots(
      {
        sellerSnapshot: { name: "Фирма А", bulstatNumber: "123" },
      } as Record<string, unknown>,
      { id: "c1", name: "Фирма А", logo: "https://cdn.example/logo.png" },
      null,
      []
    );
    expect(merged.company).toMatchObject({
      name: "Фирма А",
      logo: "https://cdn.example/logo.png",
    });
  });

  it("withDocumentSnapshots keeps snapshot logo when present", () => {
    const merged = withDocumentSnapshots(
      {
        sellerSnapshot: {
          name: "Фирма А",
          logo: "https://cdn.example/old.png",
        },
      } as Record<string, unknown>,
      { id: "c1", name: "Фирма А", logo: "https://cdn.example/new.png" },
      null,
      []
    );
    expect(merged.company).toMatchObject({ logo: "https://cdn.example/old.png" });
  });
});
