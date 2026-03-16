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
    <Card className="relative overflow-hidden border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 group">
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-linear-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <CardContent className="relative p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex-1 min-w-0">
            <p className="tiny-text font-medium text-muted-foreground mb-1.5 sm:mb-2">{title}</p>
            <div className="flex items-baseline gap-1">
              <AnimatedCounter 
                value={value} 
                decimals={decimals}
                duration={1500}
                className="text-lg sm:text-2xl font-bold tracking-tight"
              />
              {currency && (
                <span className="text-sm sm:text-lg font-semibold text-muted-foreground">{currency}</span>
              )}
            </div>
          </div>
          <div className={`p-1.5 sm:p-2 rounded-lg ${iconBg} flex-shrink-0`}>
            <div className={`p-1.5 sm:p-2 rounded-md bg-linear-to-br ${gradient} shadow-xs`}>
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>
        </div>
        
        <p className="tiny-text text-muted-foreground mb-2 hidden sm:block">{description}</p>
        
        {trend && (
          <div className="flex items-center gap-1 pt-2 border-t border-border/50">
            {trendUp ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-600 shrink-0" />
            )}
            <span className={`text-xs font-semibold shrink-0 ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend}
            </span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-0.5 truncate">спрямо миналия месец</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
