"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

export function ThemeToggleSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <Sun className="h-4 w-4" />
        <div className="w-10 h-6 bg-gray-200 rounded-full animate-pulse" />
        <Moon className="h-4 w-4" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="flex items-center space-x-2">
      <Sun
        className={`h-4 w-4 ${!isDark ? "text-yellow-500" : "text-gray-400"}`}
      />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle theme"
      />
      <Moon
        className={`h-4 w-4 ${isDark ? "text-blue-300" : "text-gray-400"}`}
      />
    </div>
  );
}
