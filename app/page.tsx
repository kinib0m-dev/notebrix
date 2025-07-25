import { Button } from "@/components/ui/button";
import { ThemeToggleSwitch } from "@/components/theme/ThemeToggleSwitch";
import { ThemeToggleIcon } from "@/components/theme/ThemeToggleIcon";
import { ThemeToggleSegmented } from "@/components/theme/ThemeToggleSegmented";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Auth SaaS Base</h1>
        <p className="text-muted-foreground max-w-md">
          Choose your preferred theme toggle style below, then proceed to login.
        </p>
      </div>

      <div className="space-y-8 w-full max-w-md">
        {/* Theme Toggle Options */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-4">
              Theme Toggle Variants
            </h2>
          </div>

          {/* Switch Style */}
          <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg">
            <h3 className="text-sm font-medium">Switch Style</h3>
            <ThemeToggleSwitch />
          </div>

          {/* Icon Style */}
          <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg">
            <h3 className="text-sm font-medium">
              Icon Style (Cycles through themes)
            </h3>
            <ThemeToggleIcon />
          </div>

          {/* Segmented Style */}
          <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg">
            <h3 className="text-sm font-medium">Segmented Control Style</h3>
            <ThemeToggleSegmented />
          </div>
        </div>

        {/* Login Button */}
        <div className="flex justify-center pt-4">
          <Button asChild size="lg">
            <Link href="/login">Continue to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
