import {
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  startOfYear,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  format,
} from "date-fns";
import { bg } from "date-fns/locale";
import { isIssuedLikeStatus } from "@/lib/invoice-status";

export type RevenueChartRow = {
  issueDate: string;
  total: number;
  status: string;
};

/** Preset: range + implied bucket size (дни / седмици / месеци). */
export type RevenueChartMode =
  | "7d"
  | "4w"
  | "30d"
  | "3m"
  | "6m"
  | "12m"
  | "ytd";

export type RevenueBucket = {
  key: string;
  label: string;
  total: number;
  isCurrent: boolean;
  rangeStart: Date;
  rangeEnd: Date;
};

function formatMonthChartLabel(monthStart: Date): string {
  const month = monthStart.getMonth();
  if (month >= 2 && month <= 5) return format(monthStart, "LLLL", { locale: bg });
  return format(monthStart, "MMM", { locale: bg });
}

function sumIssuedInRange(rows: RevenueChartRow[], start: Date, end: Date): number {
  return rows.reduce((sum, r) => {
    if (!isIssuedLikeStatus(r.status)) return sum;
    const d = new Date(r.issueDate);
    if (Number.isNaN(d.getTime())) return sum;
    if (d >= start && d <= end) return sum + Number(r.total || 0);
    return sum;
  }, 0);
}

export const REVENUE_CHART_PRESETS: {
  id: RevenueChartMode;
  label: string;
  hint: string;
}[] = [
  { id: "7d", label: "Последните 7 дни", hint: "по дни" },
  { id: "4w", label: "Последните 4 седмици", hint: "по седмица" },
  { id: "30d", label: "Последните 30 дни", hint: "по дни" },
  { id: "3m", label: "Последните 3 месеца", hint: "по месец" },
  { id: "6m", label: "Последните 6 месеца", hint: "по месец" },
  { id: "12m", label: "Последните 12 месеца", hint: "по месец" },
  { id: "ytd", label: "От началото на годината", hint: "по месец" },
];

export function buildRevenueBuckets(
  rows: RevenueChartRow[],
  mode: RevenueChartMode,
  nowInput: Date
): RevenueBucket[] {
  const now = startOfDay(nowInput);

  if (mode === "7d") {
    const start = subDays(now, 6);
    const days = eachDayOfInterval({ start, end: now });
    return days.map((day) => {
      const rs = startOfDay(day);
      const re = endOfDay(day);
      return {
        key: rs.toISOString(),
        label: format(day, "EEE d.MM", { locale: bg }),
        total: sumIssuedInRange(rows, rs, re),
        isCurrent: isSameDay(day, now),
        rangeStart: rs,
        rangeEnd: re,
      };
    });
  }

  if (mode === "30d") {
    const start = subDays(now, 29);
    const days = eachDayOfInterval({ start, end: now });
    return days.map((day) => {
      const rs = startOfDay(day);
      const re = endOfDay(day);
      return {
        key: rs.toISOString(),
        label: format(day, "d.MM", { locale: bg }),
        total: sumIssuedInRange(rows, rs, re),
        isCurrent: isSameDay(day, now),
        rangeStart: rs,
        rangeEnd: re,
      };
    });
  }

  if (mode === "4w") {
    const buckets: RevenueBucket[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const rs = startOfDay(weekStart);
      const periodEnd = weekEnd < now ? weekEnd : now;
      const re = endOfDay(periodEnd);
      const total = sumIssuedInRange(rows, rs, re);
      const inCurrentWeek = now >= rs && now <= endOfDay(weekEnd);
      buckets.push({
        key: rs.toISOString(),
        label: `${format(weekStart, "d.MM", { locale: bg })}–${format(periodEnd, "d.MM", { locale: bg })}`,
        total,
        isCurrent: inCurrentWeek,
        rangeStart: rs,
        rangeEnd: re,
      });
    }
    return buckets;
  }

  if (mode === "ytd") {
    const yearStart = startOfYear(now);
    const outYtd: RevenueBucket[] = [];
    let m = startOfMonth(yearStart);
    while (m <= now) {
      const rs = startOfMonth(m);
      const monthEnd = endOfMonth(m);
      const re = endOfDay(monthEnd > now ? now : monthEnd);
      outYtd.push({
        key: rs.toISOString(),
        label: formatMonthChartLabel(rs),
        total: sumIssuedInRange(rows, rs, re),
        isCurrent: isSameMonth(m, now),
        rangeStart: rs,
        rangeEnd: re,
      });
      m = addMonths(m, 1);
    }
    return outYtd;
  }

  const monthCountByMode: Record<string, number> = {
    "3m": 3,
    "6m": 6,
    "12m": 12,
  };
  const count = monthCountByMode[mode];
  if (!count) return [];

  const out: RevenueBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(monthStart);
    const rs = startOfDay(monthStart);
    const re = endOfDay(monthEnd > now ? now : monthEnd);
    out.push({
      key: rs.toISOString(),
      label: formatMonthChartLabel(monthStart),
      total: sumIssuedInRange(rows, rs, re),
      isCurrent: isSameMonth(monthStart, now),
      rangeStart: rs,
      rangeEnd: re,
    });
  }
  return out;
}

export function totalRevenueInBuckets(buckets: RevenueBucket[]): number {
  return buckets.reduce((s, b) => s + b.total, 0);
}
