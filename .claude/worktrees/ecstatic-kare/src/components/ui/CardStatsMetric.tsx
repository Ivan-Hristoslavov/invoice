import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardStatsMetricProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  /** Optional accent for icon tile (Tailwind gradient classes). Omit for neutral HeroUI-style tile. */
  gradient?: string;
  valueClassName?: string;
  valueSuffix?: string;
  /** По-малък padding и типография — за 3 колони на един ред на тесни екрани. */
  compact?: boolean;
  className?: string;
}

export function CardStatsMetric({
  title,
  value,
  icon: Icon,
  gradient,
  valueClassName,
  valueSuffix,
  compact = false,
  className,
}: CardStatsMetricProps) {
  const useGradient = Boolean(gradient);

  return (
    <Card
      className={cn(
        "min-w-0 rounded-lg border border-border/60 bg-card shadow-none sm:rounded-xl",
        compact && "rounded-md border-border/50",
        className
      )}
    >
      <CardContent
        className={cn(
          "!p-1.5 sm:!p-2 md:!p-2 md:!pt-1.5",
          compact && "!p-1 sm:!p-1.5 md:!p-1.5 md:!pt-1"
        )}
      >
        <div className={cn("flex items-center justify-between", compact ? "gap-1" : "gap-1.5")}>
          <div className="min-w-0">
            <p
              className={cn(
                "font-medium leading-tight text-muted-foreground",
                compact
                  ? "line-clamp-2 text-[9px] leading-snug sm:text-[10px]"
                  : "text-[10px] sm:text-[11px]"
              )}
            >
              {title}
            </p>
            <div className="flex items-baseline gap-0.5">
              <p
                className={cn(
                  "font-semibold tabular-nums",
                  compact ? "text-xs sm:text-sm" : "text-sm sm:text-base",
                  !valueClassName && "text-foreground",
                  valueClassName
                )}
              >
                {value}
              </p>
              {valueSuffix && (
                <span
                  className={cn(
                    "text-muted-foreground",
                    compact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs"
                  )}
                >
                  {valueSuffix}
                </span>
              )}
            </div>
          </div>
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-md",
              compact ? "h-4 w-4 sm:h-5 sm:w-5" : "h-5 w-5 sm:h-6 sm:w-6",
              useGradient
                ? cn("bg-linear-to-br text-white", gradient)
                : "bg-muted/80 text-muted-foreground dark:bg-muted/50"
            )}
          >
            <Icon className={compact ? "h-2 w-2 sm:h-2.5 sm:w-2.5" : "h-2.5 w-2.5 sm:h-3 sm:w-3"} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
