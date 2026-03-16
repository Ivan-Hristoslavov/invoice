"use client";

import { 
  Euro, 
  Calendar, 
  FileText, 
  Users, 
  Building, 
  TrendingUp, 
  Package,
  ArrowUpRight, 
  ArrowDownRight,
  LucideIcon 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";

// Map of icon names to components
const iconMap: Record<string, LucideIcon> = {
  euro: Euro,
  calendar: Calendar,
  fileText: FileText,
  users: Users,
  building: Building,
  trendingUp: TrendingUp,
  package: Package,
};

interface StatsCardProps {
  title: string;
  value: number;
  currency?: string;
  description: string;
  iconName: string;
  trend?: string;
  trendUp?: boolean;
  gradient: string;
  bgGradient: string;
  iconBg: string;
  decimals?: number;
}

export function StatsCard({
  title,
  value,
  currency = "",
  description,
  iconName,
  trend,
  trendUp,
  gradient,
  bgGradient,
  iconBg,
  decimals = 0,
}: StatsCardProps) {
  const Icon = iconMap[iconName] || FileText;

  return (
    <Card className="relative overflow-hidden rounded-xl border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 group">
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-linear-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <CardContent className="relative p-2 sm:p-2.5">
        <div className="flex items-start justify-between gap-2 mb-1 sm:mb-1.5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground sm:text-xs mb-0.5">{title}</p>
            <div className="flex items-baseline gap-0.5">
              <AnimatedCounter 
                value={value} 
                decimals={decimals}
                duration={1500}
                className="text-base font-bold tracking-tight sm:text-lg"
              />
              {currency && (
                <span className="text-xs font-semibold text-muted-foreground sm:text-sm">{currency}</span>
              )}
            </div>
          </div>
          <div className={`p-1 sm:p-1.5 rounded-md ${iconBg} shrink-0`}>
            <div className={`p-1 sm:p-1.5 rounded bg-linear-to-br ${gradient} shadow-xs`}>
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
            </div>
          </div>
        </div>
        
        <p className="text-[10px] text-muted-foreground hidden sm:block sm:text-xs mb-1">{description}</p>
        
        {trend && (
          <div className="flex items-center gap-1 pt-1.5 border-t border-border/50">
            {trendUp ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-600 shrink-0" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-600 shrink-0" />
            )}
            <span className={`text-[10px] font-semibold shrink-0 sm:text-xs ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend}
            </span>
            <span className="hidden sm:inline text-[10px] text-muted-foreground ml-0.5 truncate sm:text-xs">спрямо миналия месец</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
