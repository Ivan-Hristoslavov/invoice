"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSectionKicker } from "@/components/app/AppSectionKicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  REVENUE_CHART_PRESETS,
  buildRevenueBuckets,
  totalRevenueInBuckets,
  type RevenueChartMode,
  type RevenueChartRow,
} from "@/lib/dashboard-revenue-buckets";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardRevenueChartProps = {
  rows: RevenueChartRow[];
  /** Server “today” at local midnight as epoch ms for stable buckets vs. hydration. */
  anchorMs: number;
};

function formatEuroCompact(n: number): string {
  if (n <= 0) return "";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

export function DashboardRevenueChart({ rows, anchorMs }: DashboardRevenueChartProps) {
  const [mode, setMode] = useState<RevenueChartMode>("6m");
  const anchorDate = useMemo(() => new Date(anchorMs), [anchorMs]);

  const buckets = useMemo(
    () => buildRevenueBuckets(rows, mode, anchorDate),
    [rows, mode, anchorDate]
  );

  const periodTotal = useMemo(() => totalRevenueInBuckets(buckets), [buckets]);
  const maxVal = Math.max(...buckets.map((b) => b.total), 1);
  const n = buckets.length || 1;

  const linePoints = useMemo(() => {
    if (n < 2) return "";
    return buckets
      .map((b, i) => {
        const x = ((i + 0.5) / n) * 100;
        const y = 100 - (b.total / maxVal) * 88 - 6;
        return `${x},${y}`;
      })
      .join(" ");
  }, [buckets, n, maxVal]);

  const areaPoints = linePoints && n >= 2 ? `0,100 ${linePoints} 100,100` : "";

  const presetMeta = REVENUE_CHART_PRESETS.find((p) => p.id === mode);
  const selectLabel = presetMeta ? `${presetMeta.label} (${presetMeta.hint})` : "";

  return (
    <Card className="relative overflow-hidden border border-border/50 shadow-md">
      <div
        className="absolute left-0 right-0 top-0 h-[3px] bg-linear-to-r from-blue-500 via-indigo-500 to-violet-500"
        aria-hidden
      />
      <CardHeader className="flex flex-col gap-3 pb-3 px-3 pt-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
        <div className="min-w-0 space-y-2">
          <AppSectionKicker icon={BarChart3}>Приходи</AppSectionKicker>
          <CardTitle className="card-title">Приходи от издадени фактури</CardTitle>
          <CardDescription className="card-description">
            {selectLabel}. Общо за периода:{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {periodTotal.toFixed(2)} €
            </span>
          </CardDescription>
        </div>
        <div className="w-full shrink-0 sm:w-[min(100%,280px)]">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Период
          </label>
          <Select value={mode} onValueChange={(v) => setMode(v as RevenueChartMode)}>
            <SelectTrigger className="h-10 w-full rounded-xl text-sm" aria-label="Избор на период за графиката">
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              {REVENUE_CHART_PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id} textValue={p.label}>
                  {p.label}{" "}
                  <span className="text-muted-foreground">({p.hint})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
        <div className="relative rounded-xl border border-border/40 bg-muted/15 px-2 py-3 sm:px-3 dark:bg-muted/10">
          {/* subtle grid */}
          <div
            className="pointer-events-none absolute inset-x-2 top-3 bottom-10 opacity-[0.35] sm:inset-x-3"
            aria-hidden
          >
            <div className="flex h-full flex-col justify-between">
              <div className="h-px w-full bg-border/60" />
              <div className="h-px w-full bg-border/40" />
              <div className="h-px w-full bg-border/25" />
            </div>
          </div>

          <div className="relative h-[200px] w-full min-w-0">
            {linePoints ? (
              <svg
                className="pointer-events-none absolute inset-x-0 top-2 z-10 h-[calc(100%-3.25rem)] w-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden
              >
                <defs>
                  <linearGradient id="revenue-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {areaPoints ? (
                  <polygon points={areaPoints} fill="url(#revenue-area)" stroke="none" />
                ) : null}
                <polyline
                  fill="none"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  points={linePoints}
                />
              </svg>
            ) : null}

            <div
              className={cn(
                "relative z-[1] flex h-full min-h-0 items-stretch gap-0.5 overflow-x-auto pb-8 sm:gap-1 md:gap-1.5",
                (mode === "30d" || mode === "7d") && "snap-x snap-mandatory"
              )}
            >
              {buckets.map((m) => {
                const pct = maxVal > 0 ? (m.total / maxVal) * 100 : 0;
                const barHeight = Math.max(pct, m.total > 0 ? 4 : 2);
                return (
                  <div
                    key={m.key}
                    className={cn(
                      "flex h-full min-h-0 min-w-[22px] flex-1 flex-col items-center gap-1 sm:min-w-0",
                      (mode === "30d" || mode === "7d") && "min-w-[18px] snap-start"
                    )}
                    title={`${m.label}: ${m.total.toFixed(2)} €`}
                  >
                    <p className="h-4 shrink-0 text-[9px] font-medium tabular-nums leading-none text-muted-foreground/80 sm:text-[10px]">
                      {formatEuroCompact(m.total)}
                    </p>
                    <div className="flex min-h-0 w-full flex-1 flex-col justify-end">
                      <div
                        className={cn(
                          "w-full rounded-t-md shadow-sm transition-all duration-500 ease-out",
                          m.isCurrent
                            ? "bg-linear-to-t from-emerald-600 to-emerald-400 shadow-emerald-500/25"
                            : "bg-linear-to-t from-[hsl(var(--chart-2)/0.45)] to-[hsl(var(--chart-2)/0.2)]"
                        )}
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>
                    <p
                      className={cn(
                        "line-clamp-2 min-h-[2rem] max-w-full shrink-0 text-center text-[8px] font-medium leading-tight sm:text-[9px]",
                        m.isCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/75"
                      )}
                      title={m.label}
                    >
                      {m.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
