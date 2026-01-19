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
    <Card className="border border-border/50 shadow-sm bg-gradient-to-br from-card/60 to-card/30">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="tiny-text text-muted-foreground font-medium">{title}</p>
            <div className="flex items-baseline gap-1">
              <p className={cn("text-lg sm:text-2xl font-bold", valueClassName)}>
                {value}
              </p>
              {valueSuffix && (
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {valueSuffix}
                </span>
              )}
            </div>
          </div>
          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", `bg-gradient-to-br ${gradient}`)}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
