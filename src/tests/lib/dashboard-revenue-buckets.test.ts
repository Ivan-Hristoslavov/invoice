import { describe, expect, it } from "vitest";
import { buildRevenueBuckets, totalRevenueInBuckets } from "@/lib/dashboard-revenue-buckets";

describe("buildRevenueBuckets", () => {
  const anchor = new Date("2026-06-15T12:00:00.000Z");
  const rows = [
    { issueDate: "2026-06-10", total: 100, status: "ISSUED" },
    { issueDate: "2026-05-20", total: 50, status: "UNPAID" },
    { issueDate: "2026-05-01", total: 200, status: "DRAFT" },
  ];

  it("6m returns six monthly buckets and sums issued-like only", () => {
    const buckets = buildRevenueBuckets(rows, "6m", anchor);
    expect(buckets).toHaveLength(6);
    const june = buckets.find((b) => b.isCurrent);
    expect(june).toBeDefined();
    expect(june!.total).toBe(100);
    expect(totalRevenueInBuckets(buckets)).toBe(150);
  });

  it("7d returns seven day buckets", () => {
    const buckets = buildRevenueBuckets(rows, "7d", anchor);
    expect(buckets).toHaveLength(7);
  });

  it("ytd includes months from January through current", () => {
    const buckets = buildRevenueBuckets(rows, "ytd", anchor);
    expect(buckets.length).toBeGreaterThanOrEqual(6);
    expect(buckets.some((b) => b.isCurrent)).toBe(true);
  });
});
