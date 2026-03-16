import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardStatsMetricProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  valueClassName?: string;
  valueSuffix?: string;
}

export function CardStatsMetric({
  title,
  value,
  icon: Icon,
  gradient,
  valueClassName,
  valueSuffix,
}: CardStatsMetricProps) {
  return (
    <Card className="rounded-xl border border-border/50 shadow-xs bg-linear-to-br from-card/60 to-card/30">
      <CardContent className="p-2 sm:p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">{title}</p>
            <div className="flex items-baseline gap-0.5">
              <p className={cn("text-sm font-bold sm:text-lg", valueClassName)}>
                {value}
              </p>
              {valueSuffix && (
                <span className="text-[10px] text-muted-foreground sm:text-xs">
                  {valueSuffix}
                </span>
              )}
            </div>
          </div>
          <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md sm:h-7 sm:w-7", `bg-linear-to-br ${gradient}`)}>
            <Icon className="h-3 w-3 text-white sm:h-3.5 sm:w-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
