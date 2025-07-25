"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeToggleSegmented() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex bg-gray-100 rounded-lg p-1 space-x-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="px-3 py-1 h-8 bg-gray-200 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  const themes = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const;

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 space-x-1">
      {themes.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant={theme === value ? "default" : "ghost"}
          size="sm"
          onClick={() => setTheme(value)}
          className={`flex items-center space-x-1 px-3 py-1 ${
            theme === value
              ? "bg-white dark:bg-gray-700 shadow-sm"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon className="h-3 w-3 text-foreground" />
          <span className="text-xs text-foreground">{label}</span>
        </Button>
      ))}
    </div>
  );
}
