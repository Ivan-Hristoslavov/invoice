"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light", label: "Светла", icon: Sun },
  { value: "dark", label: "Тъмна", icon: Moon },
  { value: "system", label: "Системна", icon: Monitor },
] as const;

export function AppearanceForm() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Тема</CardTitle>
          <CardDescription>Изберете светла, тъмна или системна тема.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Тема</CardTitle>
        <CardDescription>
          Изберете светла, тъмна или системна тема (следва настройките на устройството).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {themes.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={theme === value ? "default" : "outline"}
              size="sm"
              className={cn(
                "gap-2 text-foreground",
                theme === value && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
              onClick={() => setTheme(value)}
              aria-pressed={theme === value}
              aria-label={`Тема: ${label}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Текуща тема: {resolvedTheme === "dark" ? "Тъмна" : "Светла"}
          {theme === "system" && " (системна)"}
        </p>
      </CardContent>
    </Card>
  );
}
