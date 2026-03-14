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
    <Card className="border border-border/50 shadow-xs bg-linear-to-br from-card/60 to-card/30">
      <CardContent className="p-2.5 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="tiny-text font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <p className={cn("text-base font-bold sm:text-2xl", valueClassName)}>
                {value}
              </p>
              {valueSuffix && (
                <span className="text-[11px] text-muted-foreground sm:text-sm">
                  {valueSuffix}
                </span>
              )}
            </div>
          </div>
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9", `bg-linear-to-br ${gradient}`)}>
            <Icon className="h-3.5 w-3.5 text-white sm:h-5 sm:w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
